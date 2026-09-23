import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateQuantityAsync, 
  removeItemAsync, 
  clearCartAsync, 
  fetchCart, 
  addToCartAsync 
} from '../../redux/slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { message, notification } from 'antd';
import axios from '../../api/axios';
import socket from '../../socket';
import { 
  ShoppingCartOutlined, 
  DeleteOutlined, 
  MinusOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  TagOutlined,
  InfoCircleOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  CreditCardOutlined,
  CustomerServiceOutlined,
  CarOutlined,
  CloseOutlined,
  FireOutlined,
  ShopOutlined
} from '@ant-design/icons';

const defaultFallbackRecs = [
  {
    id: 'rec-1',
    name: 'Margherita Pizza',
    price: 199.00,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=400',
    restaurantName: 'The Food Place',
    restaurant_id: 1
  },
  {
    id: 'rec-2',
    name: 'Garlic Bread',
    price: 99.00,
    image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=400',
    restaurantName: 'The Food Place',
    restaurant_id: 1
  },
  {
    id: 'rec-3',
    name: 'Chocolate Brownie',
    price: 149.00,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400',
    restaurantName: 'The Food Place',
    restaurant_id: 1
  },
  {
    id: 'rec-4',
    name: 'Coke (500ml)',
    price: 60.00,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
    restaurantName: 'The Food Place',
    restaurant_id: 1
  },
  {
    id: 'rec-5',
    name: 'Classic Cheeseburger',
    price: 189.00,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400',
    restaurantName: 'Burger Hub',
    restaurant_id: 1
  },
  {
    id: 'rec-6',
    name: 'Spicy Ramen Bowl',
    price: 220.00,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400',
    restaurantName: 'Tokyo Noodle Bar',
    restaurant_id: 1
  }
];

const VALID_COUPONS = {
  WELCOME50: { code: 'WELCOME50', type: 'percent', value: 50, label: '50% OFF', maxDiscount: 200 },
  ORDERLY20: { code: 'ORDERLY20', type: 'percent', value: 20, label: '20% OFF' },
  FLAT50: { code: 'FLAT50', type: 'flat', value: 50, label: '₹50 OFF' },
  FOODIE10: { code: 'FOODIE10', type: 'percent', value: 10, label: '10% OFF' }
};

// Shuffle helper function
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function CartPage() {
  const { items, total } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [recommendedItems, setRecommendedItems] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = sessionStorage.getItem('orderly_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Fetch real menu items from API, exclude cart items, and shuffle randomly!
  useEffect(() => {
    const fetchMenuRecommendations = async () => {
      try {
        setLoadingRecs(true);
        const res = await axios.get('/menu');
        let allItems = [];
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          allItems = res.data.data;
        } else {
          allItems = defaultFallbackRecs;
        }

        const cartItemIds = new Set(items.map(i => String(i.id)));
        const filtered = allItems.filter(item => !cartItemIds.has(String(item.id)));
        const candidates = filtered.length > 0 ? filtered : allItems;
        const shuffled = shuffleArray(candidates);

        setRecommendedItems(shuffled.slice(0, 4).map(item => ({
          id: item.id,
          name: item.name,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 149.00,
          image: item.image_url || item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          restaurantName: item.Restaurant?.name || item.restaurant?.name || item.restaurantName || item.restaurant_name || 'Orderly Gourmet Hub',
          restaurant_id: item.restaurant_id || 1
        })));
      } catch (err) {
        console.error('Error fetching menu recommendations:', err);
        const shuffled = shuffleArray(defaultFallbackRecs);
        setRecommendedItems(shuffled.slice(0, 4));
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchMenuRecommendations();
  }, []);

  useEffect(() => {
    socket.on('MENU_ITEM_UPDATED', (data) => {
      if (items.some(i => i.id === data.itemId)) {
        if (!data.isAvailable) {
          notification.warning({
            message: 'Item Unavailable',
            description: `"${data.name}" has just gone Out of Order and will be excluded.`,
            duration: 5
          });
        } else {
          notification.success({
            message: 'Item Back in Stock!',
            description: `"${data.name}" is available again.`,
            duration: 3
          });
        }
        dispatch(fetchCart());
      }
    });

    return () => {
      socket.off('MENU_ITEM_UPDATED');
    };
  }, [items, dispatch]);

  const subtotal = total || items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  
  // Calculate dynamic coupon discount
  let discountAmount = 0;
  if (appliedCoupon && items.length > 0 && subtotal > 0) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else if (appliedCoupon.type === 'flat') {
      discountAmount = appliedCoupon.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const deliveryFee = items.length > 0 ? 30.00 : 0.00;
  const platformFee = items.length > 0 ? 5.00 : 0.00;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gst = taxableAmount * 0.05;
  const grandTotal = items.length > 0 ? Math.max(0, taxableAmount + deliveryFee + platformFee + gst) : 0.00;

  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      message.warning('Please enter a valid promo code.');
      return;
    }
    if (items.length === 0) {
      message.warning('Please add items to your cart before applying a coupon.');
      return;
    }

    const coupon = VALID_COUPONS[code];
    if (!coupon) {
      message.error(`Invalid coupon code "${code}". Try WELCOME50, ORDERLY20, or FLAT50!`);
      return;
    }

    let calcDiscount = 0;
    if (coupon.type === 'percent') {
      calcDiscount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && calcDiscount > coupon.maxDiscount) {
        calcDiscount = coupon.maxDiscount;
      }
    } else if (coupon.type === 'flat') {
      calcDiscount = coupon.value;
    }
    calcDiscount = Math.min(calcDiscount, subtotal);

    const couponData = {
      code: coupon.code,
      label: coupon.label,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
      discountAmount: calcDiscount
    };

    setAppliedCoupon(couponData);
    sessionStorage.setItem('orderly_applied_coupon', JSON.stringify(couponData));
    setCouponInput('');
    message.success(`🎉 Coupon "${coupon.code}" applied! You saved ₹${calcDiscount.toFixed(2)}.`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    sessionStorage.removeItem('orderly_applied_coupon');
    message.info('Coupon removed.');
  };

  const handleAddRecommended = (recItem) => {
    dispatch(addToCartAsync({
      menu_item_id: recItem.id,
      quantity: 1,
      restaurant_id: recItem.restaurant_id,
      item: recItem
    }));
    message.success(`Added ${recItem.name} to cart!`);
  };

  const handleClearCart = () => {
    dispatch(clearCartAsync());
    setAppliedCoupon(null);
    sessionStorage.removeItem('orderly_applied_coupon');
    message.info('Cart cleared');
  };

  return (
    <div className="pb-16 animate-fade-in -mt-16 bg-neutral-50/60 min-h-screen">

      {/* ── FULL-BLEED HERO BANNER ── */}
      <div className="relative bg-neutral-900 text-white pt-24 pb-14 border-b border-neutral-800 overflow-hidden">
        <img
          src="/food_banners/cooking-banner.jpg"
          alt="Cart Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2.5 border border-orange-500/30">
              🛒 YOUR ORDER
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Your Cart</h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Great choices! Review your items and proceed to checkout.
            </p>
          </div>

          <div className="hidden lg:block text-right bg-black/40 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/10 max-w-xs shadow-xl">
            <p className="text-xs font-serif italic text-amber-300 leading-snug">
              "Good food is a good mood."
            </p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
              — UNKNOWN
            </p>
          </div>
        </div>
      </div>

      {/* ── CART CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* LEFT COLUMN: Cart Items OR Empty State + Recommendations */}
          <div className="lg:col-span-2 space-y-8">
            {items.length === 0 ? (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[320px]">
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCartOutlined className="text-2xl" />
                </div>
                <h3 className="font-bold text-neutral-900 text-lg mb-1">Your cart is empty</h3>
                <p className="text-neutral-500 text-sm mb-6">Looks like you haven't added anything to your cart yet.</p>
                <button
                  onClick={() => navigate('/customer/menu')}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                  <h2 className="text-lg font-bold text-neutral-900">
                    Cart Items ({items.length})
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <DeleteOutlined className="text-xs" /> Clear Cart
                  </button>
                </div>

                {/* Items List */}
                <div className="divide-y divide-neutral-100">
                  {items.map((item) => (
                    <div
                      key={item.cartItemId || item.id}
                      className={`py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${!item.isAvailable ? 'opacity-60' : ''}`}
                    >
                      {/* Item Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200/60 flex-shrink-0">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop'}
                            className="w-full h-full object-cover"
                            alt={item.name}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-neutral-900 text-base leading-snug">{item.name}</h4>
                          <p className="text-neutral-400 text-xs font-medium mt-0.5">{item.restaurantName || 'The Food Place'}</p>
                          <p className="text-neutral-900 font-bold text-sm mt-1">₹{Number(item.price).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Quantity Controller + Item Total + Trash */}
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6">
                        <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50/50 p-0.5">
                          <button
                            onClick={() => dispatch(updateQuantityAsync({ itemId: item.cartItemId || item.id, quantity: item.quantity - 1 }))}
                            className="w-7 h-7 rounded bg-white hover:bg-neutral-100 text-neutral-700 flex items-center justify-center text-xs font-bold transition-colors shadow-2xs cursor-pointer border border-neutral-200/60"
                          >
                            <MinusOutlined />
                          </button>
                          <span className="font-bold text-sm w-7 text-center text-neutral-800">{item.quantity}</span>
                          <button
                            onClick={() => dispatch(updateQuantityAsync({ itemId: item.cartItemId || item.id, quantity: item.quantity + 1 }))}
                            disabled={!item.isAvailable || item.quantity >= 20}
                            className="w-7 h-7 rounded bg-white hover:bg-neutral-100 text-neutral-700 flex items-center justify-center text-xs font-bold transition-colors shadow-2xs cursor-pointer border border-neutral-200/60"
                          >
                            <PlusOutlined />
                          </button>
                        </div>

                        <span className="font-bold text-neutral-900 text-base min-w-[70px] text-right">
                          ₹{(Number(item.price) * item.quantity).toFixed(2)}
                        </span>

                        <button
                          onClick={() => dispatch(removeItemAsync(item.cartItemId || item.id))}
                          className="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <DeleteOutlined className="text-base" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── WORKING COUPON CODE CARD ── */}
                {!appliedCoupon ? (
                  <div className="bg-orange-50/70 border border-orange-200/60 rounded-2xl p-4 space-y-3 mt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-base flex-shrink-0">
                        <TagOutlined />
                      </div>
                      <div>
                        <h5 className="font-bold text-neutral-900 text-sm leading-tight">Have a coupon code?</h5>
                        <p className="text-neutral-500 text-xs mt-0.5">Apply a promo code to get exciting discounts.</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter code (e.g. WELCOME50)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        className="flex-1 px-3.5 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase tracking-wider"
                      />
                      <button
                        onClick={() => handleApplyCoupon()}
                        className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
                      >
                        Apply Coupon
                      </button>
                    </div>

                    {/* Quick clickable promo tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-neutral-500">Popular:</span>
                      {Object.values(VALID_COUPONS).map((c) => (
                        <button
                          key={c.code}
                          onClick={() => handleApplyCoupon(c.code)}
                          className="px-2.5 py-1 bg-white hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <FireOutlined className="text-orange-500 text-[10px]" />
                          <span>{c.code}</span>
                          <span className="text-neutral-400 font-normal">({c.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 mt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-base flex-shrink-0">
                        <CheckCircleFilled />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-emerald-900 text-sm">Coupon "{appliedCoupon.code}" Applied!</h5>
                          <span className="bg-emerald-200 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {appliedCoupon.label}
                          </span>
                        </div>
                        <p className="text-emerald-700 text-xs mt-0.5">
                          You saved <span className="font-bold">₹{discountAmount.toFixed(2)}</span> on this order.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      <CloseOutlined className="text-[10px]" /> Remove
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* "You might also like" SECTION (Fetched real menu items & shuffled) */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-neutral-900">You might also like</h3>
                <button
                  onClick={() => navigate('/customer/menu')}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  View More <ArrowRightOutlined className="text-[10px]" />
                </button>
              </div>

              {loadingRecs ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="bg-neutral-100 rounded-2xl h-44 animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {recommendedItems.map((rec) => {
                    const isInCart = items.some(i => String(i.id) === String(rec.id));
                    return (
                      <div
                        key={rec.id}
                        className="bg-white rounded-2xl p-3 border border-neutral-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="h-28 rounded-xl bg-neutral-100 overflow-hidden mb-3">
                            <img
                              src={rec.image}
                              alt={rec.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <h4 className="font-bold text-neutral-900 text-xs sm:text-sm leading-snug line-clamp-1">
                            {rec.name}
                          </h4>
                          <p className="text-[11px] font-semibold text-neutral-500 truncate mt-0.5" title={rec.restaurantName}>
                            by {rec.restaurantName || rec.restaurant?.name || rec.Restaurant?.name || 'Orderly Gourmet Hub'}
                          </p>
                          <p className="text-neutral-900 font-extrabold text-xs mt-1">₹{rec.price.toFixed(2)}</p>
                        </div>

                        <button
                          onClick={() => handleAddRecommended(rec)}
                          className={`mt-3 w-full py-1.5 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                            isInCart
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                          }`}
                        >
                          {isInCart ? (
                            <>
                              <CheckCircleFilled className="text-emerald-600 text-xs" /> Added
                            </>
                          ) : (
                            <>
                              <PlusOutlined className="text-xs" /> Add
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm space-y-5 sticky top-24">
              <h3 className="text-lg font-bold text-neutral-900 border-b border-neutral-100 pb-3">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                  <span className="font-bold text-neutral-900">₹{subtotal.toFixed(2)}</span>
                </div>

                {/* Display applied discount line item if discountAmount > 0 */}
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 font-bold">
                    <span>Promo Discount ({appliedCoupon?.code})</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Delivery Fee <InfoCircleOutlined className="text-neutral-400 text-xs cursor-help" title="Standard local delivery charge" />
                  </span>
                  <span className="font-bold text-neutral-900">₹{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    Platform Fee <InfoCircleOutlined className="text-neutral-400 text-xs cursor-help" title="Platform service fee" />
                  </span>
                  <span className="font-bold text-neutral-900">₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-bold text-neutral-900">₹{gst.toFixed(2)}</span>
                </div>

                <div className="h-px bg-neutral-200 my-2" />

                <div className="flex justify-between items-center text-neutral-900">
                  <span className="font-bold text-base">Total</span>
                  <span className="text-2xl font-black text-neutral-900">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Green Support Local Restaurants Banner */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 flex items-start gap-3">
                <CheckCircleFilled className="text-emerald-600 text-sm mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="font-bold text-emerald-800 text-xs">You're supporting local restaurants!</h5>
                  <p className="text-emerald-700/80 text-[11px] mt-0.5 font-normal">Thank you for choosing Orderly.</p>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <button
                onClick={() => items.length === 0 ? navigate('/customer/menu') : navigate('/customer/checkout')}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer text-center text-sm flex items-center justify-center gap-2 group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Trust Badges Footer */}
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold pt-3 border-t border-neutral-100">
                <span className="flex items-center gap-1">
                  <SafetyCertificateOutlined className="text-neutral-500" /> Secure Checkout
                </span>
                <span className="flex items-center gap-1">
                  <CreditCardOutlined className="text-neutral-500" /> Multiple Payment Options
                </span>
                <span className="flex items-center gap-1">
                  <CustomerServiceOutlined className="text-neutral-500" /> 24/7 Support
                </span>
              </div>
            </div>

            {/* Fast & Reliable Delivery Banner */}
            <div className="bg-orange-50/60 border border-orange-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center text-lg flex-shrink-0">
                <CarOutlined />
              </div>
              <div>
                <h5 className="font-bold text-neutral-900 text-xs">Fast & Reliable Delivery</h5>
                <p className="text-neutral-500 text-[11px] mt-0.5">Fresh food, on time, every time.</p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
