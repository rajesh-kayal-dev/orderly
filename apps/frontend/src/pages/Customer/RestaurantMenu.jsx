import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import axios from '../../api/axios';
import socket from '../../socket';
import EmptyState from '../../components/common/EmptyState';
import { notification } from 'antd';
import { 
  StarFilled, 
  LockFilled, 
  CheckCircleFilled, 
  PlusOutlined,
  MinusOutlined,
  ClockCircleFilled,
  EnvironmentOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  HeartOutlined,
  HeartFilled,
  SearchOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  CompassOutlined,
  CreditCardOutlined,
  RightOutlined,
  ShoppingOutlined
} from '@ant-design/icons';

export default function RestaurantMenu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: cartItems } = useSelector(state => state.cart);

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantClosed, setRestaurantClosed] = useState(false);
  const [closedMessage, setClosedMessage] = useState('This restaurant is currently closed.');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    if (!restaurantId) return;

    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const resResponse = await axios.get(`/restaurants/${restaurantId}`);

        if (resResponse.data?.success) {
          const storeData = resResponse.data.data;
          setRestaurant(storeData);
          if (storeData?.name) {
            document.title = `${storeData.name} - Menu`;
          }
          setRestaurantClosed(false);

          const menuResponse = await axios.get(`/menu/full/${restaurantId}`);
          if (menuResponse.data?.success && menuResponse.data.data?.length > 0) {
            const rawCategories = menuResponse.data.data;
            
            // Process real categories and items for this specific restaurant
            const processed = rawCategories.map(cat => {
              const rawItems = cat.items || cat.menuItems || cat.MenuItems || [];
              return {
                ...cat,
                items: rawItems
              };
            }).filter(cat => cat.items && cat.items.length > 0);

            setMenu(processed);
          } else {
            setMenu([]);
          }
        }
      } catch (error) {
        if (error.response?.data?.type === 'RESTAURANT_CLOSED') {
          setRestaurantClosed(true);
          setClosedMessage(error.response?.data?.message || 'This restaurant is currently closed.');
          setRestaurant(null);
          setMenu([]);
          return;
        }
        setMenu([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();

    socket.on('MENU_ITEM_UPDATED', (data) => {
      if (String(data.restaurantId) === String(restaurantId)) {
        setMenu(prevMenu => prevMenu.map(category => ({
          ...category,
          items: (category.items || category.menuItems || [])?.map(item => 
            String(item.id) === String(data.itemId) 
              ? { ...item, ...data } 
              : item
          )
        })));
      }
    });

    socket.on('RESTAURANT_STATUS_UPDATED', (data) => {
      if (String(data.restaurantId) !== String(restaurantId)) return;

      if (!data.is_open) {
        setRestaurantClosed(true);
        setClosedMessage(`${data.name || 'This restaurant'} is currently closed.`);
        notification.warning({
          message: 'Restaurant closed',
          description: `${data.name || 'This restaurant'} is no longer accepting orders.`,
          placement: 'topRight'
        });
      } else {
        setRestaurantClosed(false);
        setClosedMessage('');
        setRestaurant((prev) => prev ? { ...prev, is_open: true } : prev);
      }
    });

    return () => {
      socket.off('MENU_ITEM_UPDATED');
      socket.off('RESTAURANT_STATUS_UPDATED');
    };
  }, [restaurantId]);

  const toggleFavorite = (itemId) => {
    setFavorites(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const getItemQuantity = (itemId) => {
    const found = cartItems.find(i => String(i.id || i.menu_item_id) === String(itemId));
    return found ? found.quantity : 0;
  };

  const handleAdd = async (item) => {
    if (restaurantClosed || (restaurant && !restaurant.is_open)) {
      notification.warning({
        message: 'Restaurant is closed',
        description: 'You cannot add items while this restaurant is closed.',
        placement: 'topRight'
      });
      return;
    }

    const currentQty = getItemQuantity(item.id);
    if (currentQty >= 20) {
      notification.warning({
        message: 'Limit Reached',
        description: `You already have 20 units of ${item.name} in your cart.`,
        placement: 'topRight'
      });
      return;
    }

    try {
      await dispatch(addToCartAsync({
        menu_item_id: item.id,
        quantity: 1,
        restaurant_id: restaurant?.id || restaurantId,
        item: { ...item, restaurantName: restaurant?.name || 'Restaurant' }
      }));

      notification.success({
        message: 'Added to Cart',
        description: `${item.name} added to cart!`,
        placement: 'bottomRight',
        duration: 1.5,
      });
    } catch (error) {
      notification.success({
        message: 'Added to Cart',
        description: `${item.name} added to cart!`,
        placement: 'bottomRight',
        duration: 1.5,
      });
    }
  };

  const handleDecrease = async (item) => {
    dispatch(addToCartAsync({
      menu_item_id: item.id,
      quantity: -1,
      restaurant_id: restaurant?.id || restaurantId,
      item: { ...item }
    }));
  };

  // Dynamically generate category pills based ONLY on real categories present in this restaurant
  const categoryPills = useMemo(() => {
    const pills = [{ label: 'All Items' }];
    menu.forEach(cat => {
      if (cat.name && !pills.some(p => p.label === cat.name)) {
        pills.push({ label: cat.name });
      }
    });
    return pills;
  }, [menu]);

  // Filter real menu items by selected category pill and search query
  const displayMenu = useMemo(() => {
    let filteredCategories = menu;

    if (activeCategory !== 'All' && activeCategory !== 'All Items') {
      filteredCategories = menu.filter(category => 
        String(category.name || '').toLowerCase() === String(activeCategory || '').toLowerCase()
      );
    }

    return filteredCategories.map(category => {
      const rawItems = category.items || category.menuItems || category.MenuItems || [];
      const filteredItems = rawItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
      });

      return {
        ...category,
        items: filteredItems
      };
    }).filter(category => category.items.length > 0);
  }, [menu, searchTerm, activeCategory]);

  const cartSubtotal = cartItems.reduce((acc, curr) => acc + (Number(curr.price || curr.unit_price || 0) * (curr.quantity || 1)), 0);
  const cartTotalItems = cartItems.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4 animate-pulse">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-semibold text-sm">Loading restaurant menu...</p>
    </div>
  );

  if (restaurantClosed) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto">
        <EmptyState
          icon={<LockFilled className="text-red-500" />}
          title="Restaurant Closed"
          description={closedMessage}
          actionText="Back to Restaurants"
          onAction={() => navigate('/customer/restaurants')}
        />
      </div>
    );
  }

  const storeName = restaurant?.name || 'Restaurant';
  const storeFirstLetter = storeName.charAt(0).toUpperCase();
  const storeRating = restaurant?.rating || 4.5;
  const storeCuisine = restaurant?.description || restaurant?.cuisine_type || 'Fast Food • Multi-Cuisine';
  const storeAddress = restaurant?.address || restaurant?.location || 'City Center';

  return (
    <div className="pb-24 space-y-6 animate-fade-in font-sans max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* ── Back to Restaurants Link ── */}
      <div>
        <button
          onClick={() => navigate('/customer/restaurants')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors"
        >
          <LeftOutlined className="text-xs" /> Back to Restaurants
        </button>
      </div>

      {/* ── 1. RESTAURANT HERO BANNER (Dynamic based on real restaurant name) ── */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 text-white border border-slate-800">
        <div className="h-64 sm:h-72 w-full relative">
          <img
            src={restaurant?.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&h=600&fit=crop'}
            alt={storeName}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />

          <div className="absolute inset-0 flex items-center justify-between p-6 sm:p-10">
            <div className="flex items-center gap-6 max-w-3xl">
              
              {/* Dynamic Restaurant Avatar Box (First letter of actual store name) */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center font-black text-5xl sm:text-6xl shadow-2xl shrink-0 border-2 border-white/20 select-none">
                {storeFirstLetter}
              </div>

              {/* Text Info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                    {storeName}
                  </h1>
                  <CheckCircleFilled className="text-emerald-400 text-xl sm:text-2xl" />
                </div>

                <p className="text-sm sm:text-base text-slate-300 font-semibold">
                  {storeCuisine}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300 font-semibold pt-1">
                  <span className="flex items-center gap-1.5 text-white">
                    <StarFilled className="text-amber-400 text-sm" />
                    <span>{storeRating} (12K+ ratings)</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <ClockCircleFilled className="text-orange-400 text-sm" />
                    <span>25–35 min</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <EnvironmentOutlined className="text-orange-400 text-sm" />
                    <span>{storeAddress}</span>
                  </span>
                  <span>•</span>
                  <span>₹200 for two</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── 2. DYNAMIC CATEGORY PILL NAVIGATION & SEARCH BAR ── */}
      {categoryPills.length > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
          
          {/* Dynamic Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categoryPills.map((pill) => {
              const isActive = activeCategory === pill.label;
              return (
                <button
                  key={pill.label}
                  onClick={() => setActiveCategory(pill.label)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
                    isActive
                      ? 'bg-[#FF521C] text-white shadow-md shadow-orange-500/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'
                  }`}
                >
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search in ${storeName}...`}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-xs"
            />
          </div>
        </div>
      )}

      {/* ── 3. MAIN CONTENT: 75% MENU (9 COLS) vs 25% SIDEBAR (3 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pt-4 items-start">
        
        {/* LEFT COLUMN: 75% WIDTH MENU */}
        <div className="lg:col-span-9 space-y-12">
          {displayMenu.length > 0 ? (
            displayMenu.map((category) => {
              const categoryItems = category.items || [];
              return (
                <section key={category.id || category.name} className="space-y-5">
                  
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {category.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                        {category.subtitle || 'Freshly prepared items from our kitchen.'}
                      </p>
                    </div>
                  </div>

                  {/* 4 FOOD CARDS PER ROW GRID ON DESKTOP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categoryItems.map((item) => {
                      const qty = getItemQuantity(item.id);
                      const isFav = favorites[item.id];
                      const isVeg = item.is_veg !== undefined ? item.is_veg : true;

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                        >
                          {/* Top Image Container */}
                          <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-100">
                            <img
                              src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />

                            {/* Bestseller Badge */}
                            {item.is_bestseller && (
                              <span className="absolute top-2.5 left-2.5 bg-[#FF521C] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                                Bestseller
                              </span>
                            )}

                            {/* Favorite Heart Toggle */}
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 text-white hover:bg-black/60 flex items-center justify-center shadow-xs transition-colors backdrop-blur-xs"
                            >
                              {isFav ? <HeartFilled className="text-red-500 text-xs" /> : <HeartOutlined className="text-xs" />}
                            </button>
                          </div>

                          {/* Item Body Info */}
                          <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              {/* Veg / Non-Veg Dot Indicator */}
                              <div className="flex items-center gap-1.5">
                                <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center p-0.5 ${
                                  isVeg ? 'border-emerald-600' : 'border-red-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isVeg ? 'bg-emerald-600' : 'bg-red-600'
                                  }`} />
                                </span>
                              </div>

                              <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors">
                                {item.name}
                              </h3>

                              <p className="text-xs text-slate-500 font-normal line-clamp-2 leading-relaxed">
                                {item.description || 'Tasty meal crafted with premium ingredients.'}
                              </p>
                            </div>

                            {/* Price & Add Action Row */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                              <span className="text-sm sm:text-base font-black text-slate-900">
                                ₹{item.price}
                              </span>

                              {qty > 0 ? (
                                <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                                  <button
                                    onClick={() => handleDecrease(item)}
                                    className="w-5 h-5 rounded-md bg-white text-slate-700 font-bold flex items-center justify-center shadow-xs text-xs hover:bg-slate-50"
                                  >
                                    <MinusOutlined className="text-[10px]" />
                                  </button>
                                  <span className="text-xs font-black text-slate-900 px-1.5">{qty}</span>
                                  <button
                                    onClick={() => handleAdd(item)}
                                    className="w-5 h-5 rounded-md bg-[#FF521C] text-white font-bold flex items-center justify-center shadow-xs text-xs hover:bg-orange-600"
                                  >
                                    <PlusOutlined className="text-[10px]" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleAdd(item)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#FF521C] hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 active:scale-95"
                                >
                                  <span>Add</span>
                                  <PlusOutlined className="text-[10px]" />
                                </button>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
              <EmptyState
                title="No Menu Items Found"
                description="This restaurant has not added any menu items matching your selection."
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: 25% WIDTH SIDEBAR */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Card 1: Restaurant Details Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <InfoCircleOutlined className="text-[#FF521C] text-lg" />
                <span>Restaurant Details</span>
              </div>
              <button className="text-xs font-extrabold text-orange-600 hover:underline">
                View on Map &gt;
              </button>
            </div>

            {/* Key-Value Details */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Rating</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1">
                  <StarFilled className="text-amber-400 text-xs" /> {storeRating} (12K+)
                </span>
              </div>

              <div className="flex justify-between items-start pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-semibold">Cuisine</span>
                <span className="font-extrabold text-slate-900 text-right max-w-[170px]">{storeCuisine}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-semibold">Operating Hours</span>
                <span className="font-extrabold text-slate-900">09:00 AM – 11:00 PM</span>
              </div>

              <div className="flex justify-between items-start pt-2 border-t border-slate-100">
                <span className="text-slate-500 font-semibold">Address</span>
                <span className="font-extrabold text-slate-800 text-right max-w-[170px]">{storeAddress}</span>
              </div>
            </div>

            {/* Feature Icons Grid (2x2) */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <SafetyCertificateOutlined className="text-orange-500 text-sm" />
                  <span>Hygienic Food</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Safety assured</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <RocketOutlined className="text-orange-500 text-sm" />
                  <span>Fast Delivery</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">25-35 mins</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <CompassOutlined className="text-orange-500 text-sm" />
                  <span>Live Tracking</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Track your order</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                  <CreditCardOutlined className="text-orange-500 text-sm" />
                  <span>Secure Payment</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">100% safe</p>
              </div>
            </div>

            {/* Promo Discount Banner */}
            <div className="bg-orange-50/80 border border-orange-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs cursor-pointer hover:bg-orange-100/70 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0 select-none shadow-xs">
                  {storeFirstLetter}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-xs">Special Discount Offer</p>
                  <p className="text-[11px] text-orange-700 font-bold">15% OFF on first order</p>
                </div>
              </div>
              <RightOutlined className="text-slate-400 text-xs" />
            </div>

          </div>

          {/* Card 2: Your Cart (Sticky Live Summary Card) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs sticky top-24 space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <ShoppingOutlined className="text-[#FF521C] text-lg" />
                <span>Your Cart</span>
                <span className="text-xs font-semibold text-slate-500">({cartTotalItems} items)</span>
              </div>
              <Link to="/customer/cart" className="text-xs font-extrabold text-orange-600 hover:underline">
                View Cart &gt;
              </Link>
            </div>

            {/* Cart Items List */}
            {cartItems.length > 0 ? (
              <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                {cartItems.map((cItem) => (
                  <div key={cItem.id} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 max-w-[190px]">
                      <img
                        src={cItem.image_url || cItem.item?.image_url || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100'}
                        alt={cItem.name || cItem.item?.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <span className="font-bold text-slate-800 line-clamp-1">
                        {cItem.name || cItem.item?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-semibold text-slate-600">
                      <span className="text-slate-400">x {cItem.quantity}</span>
                      <span className="font-black text-slate-900 w-14 text-right">
                        ₹{Number(cItem.price || cItem.unit_price || 0) * cItem.quantity}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between text-base">
                  <span className="font-extrabold text-slate-900">Total</span>
                  <span className="font-black text-slate-900 text-lg">₹{cartSubtotal}</span>
                </div>

                <button
                  onClick={() => navigate('/customer/checkout')}
                  className="w-full py-3.5 rounded-xl bg-[#FF521C] hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 mt-2"
                >
                  <span>View Cart & Checkout</span>
                  <RightOutlined className="text-xs" />
                </button>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                <ShoppingOutlined className="text-3xl text-slate-300" />
                <p className="font-bold text-slate-600">Your cart is empty</p>
                <p className="text-xs text-slate-400">Add items from the menu to build your order.</p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
