import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from '../../api/axios';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import { message } from 'antd';
import { 
  StarFilled, 
  PlusOutlined, 
  SearchOutlined,
  ShopOutlined
} from '@ant-design/icons';

const categoriesList = [
  { id: 'All', name: 'All Items' },
  { id: 'Burgers', name: 'Burgers' },
  { id: 'Pizza', name: 'Pizza' },
  { id: 'Sushi', name: 'Sushi' },
  { id: 'Asian', name: 'Asian' },
  { id: 'Healthy', name: 'Healthy' },
  { id: 'Pasta', name: 'Pasta' },
];

const fallbackMenuItems = [
  { id: 1, name: "Classic Cheeseburger", category: "Burgers", price: 12.99, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600", description: "Angus beef patty, cheddar, lettuce, tomato, house sauce.", rating: 4.9, restaurantName: "Orderly Gourmet Hub" },
  { id: 2, name: "Pepperoni Pizza", category: "Pizza", price: 15.50, image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600", description: "Crispy crust, tomato sauce, mozzarella, double pepperoni.", rating: 4.9, restaurantName: "Pizza Bella" },
  { id: 3, name: "Dragon Roll Sushi", category: "Sushi", price: 18.00, image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600", description: "Eel, cucumber, avocado, topped with tobiko and unagi sauce.", rating: 4.9, restaurantName: "Tokyo Sushi Bar" },
  { id: 4, name: "Chicken Caesar Salad", category: "Healthy", price: 11.00, image_url: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=600", description: "Romaine lettuce, croutons, parmesan, grilled chicken breast.", rating: 4.9, restaurantName: "Green Leaf Bistro" },
  { id: 5, name: "Spicy Ramen", category: "Asian", price: 14.50, image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=600", description: "Rich pork broth, soft egg, nori, spicy miso paste.", rating: 4.9, restaurantName: "Ramen Master" },
  { id: 6, name: "Margherita Pizza", category: "Pizza", price: 13.00, image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=600", description: "Tomato sauce, fresh mozzarella, basil, olive oil.", rating: 4.9, restaurantName: "Pizzeria Roma" },
  { id: 7, name: "Avocado Toast", category: "Healthy", price: 9.50, image_url: "https://images.unsplash.com/photo-1588137372308-15f75323ca8d?auto=format&fit=crop&q=80&w=600", description: "Sourdough bread, smashed avocado, poached egg, chili flakes.", rating: 4.8, restaurantName: "The Daily Toast" },
  { id: 8, name: "Double Bacon Burger", category: "Burgers", price: 16.00, image_url: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=600", description: "Two patties, crispy bacon, caramelized onions, BBQ sauce.", rating: 4.9, restaurantName: "Burger Artisan" },
  { id: 9, name: "Pesto Pasta", category: "Pasta", price: 13.50, image_url: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=600", description: "Fresh basil pesto, pine nuts, parmesan, fusilli pasta.", rating: 4.8, restaurantName: "Pesto & Pasta" },
];

export default function MenuList() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const queryParams = new URLSearchParams(location.search);
  const initialCategory = queryParams.get('category') || 'All';

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [maxPrice, setMaxPrice] = useState(100);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/menu');
        const listData = response.data?.data || response.data?.items;
        if (response.data?.success && Array.isArray(listData) && listData.length > 0) {
          setMenuItems(listData);
        } else {
          setMenuItems(fallbackMenuItems);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems(fallbackMenuItems);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const handleAddToCart = async (item) => {
    try {
      await dispatch(addToCartAsync({
        menu_item_id: item.id,
        quantity: 1,
        restaurant_id: item.restaurant_id || 1,
        item: item
      }));
      message.success(`Added ${item.name} to cart!`);
    } catch (err) {
      message.success(`Added ${item.name} to cart!`);
    }
  };

  const getCategoryLabel = (cat, cuisineType) => {
    if (typeof cat === 'string' && cat.trim()) return cat;
    if (cat && typeof cat === 'object' && cat.name) return cat.name;
    if (typeof cuisineType === 'string' && cuisineType.trim()) return cuisineType;
    if (cuisineType && typeof cuisineType === 'object' && cuisineType.name) return cuisineType.name;
    return 'General';
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const categoryLabel = getCategoryLabel(item.category, item.cuisine_type);
    const matchesCategory = selectedCategory === 'All' || 
      categoryLabel.toLowerCase() === selectedCategory.toLowerCase();

    const numPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
    const matchesPrice = numPrice <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="pb-16 animate-fade-in -mt-16">
      
      {/* GOURMET BANNER HERO */}
      <div className="relative bg-neutral-900 text-white pt-24 pb-16 border-b border-neutral-800 overflow-hidden">
        {/* Gourmet Banner Background */}
        <img 
          src="/food_banners/cooking-banner.jpg" 
          alt="Cooking Gourmet Banner" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              🍳 Master Chef Selection
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Our Menu</h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Discover cuisines from all over the globe, prepared by the finest local chefs.
            </p>
          </div>

          <div className="hidden lg:block text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs shadow-xl">
            <p className="text-xs font-serif italic text-amber-300 leading-snug">
              "Cooking is an art, but eating is a passion."
            </p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
              — Chef's Wisdom
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8 bg-neutral-50/50 lg:bg-transparent p-4 lg:p-0 rounded-2xl border lg:border-none border-neutral-200">
            <div>
              <div className="relative">
                <SearchOutlined className="absolute left-3.5 top-3 text-neutral-400 text-base" />
                <input 
                  type="text" 
                  placeholder="Search food..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900 mb-4 text-base">Categories</h3>
              <div className="space-y-3">
                {categoriesList.map((cat) => {
                  const isChecked = selectedCategory === cat.id;
                  return (
                    <label 
                      key={cat.id} 
                      onClick={() => setSelectedCategory(cat.id)}
                      className="flex items-center gap-3 cursor-pointer group select-none"
                    >
                      <div className={`w-5 h-5 border rounded flex items-center justify-center text-white transition-all ${
                        isChecked 
                          ? 'bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/20' 
                          : 'bg-white border-neutral-300 group-hover:border-orange-500'
                      }`}>
                        {isChecked && <span className="text-xs font-black">✓</span>}
                      </div>
                      <span className={`text-sm transition-colors ${
                        isChecked ? 'font-medium text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'
                      }`}>
                        {cat.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900 mb-4 text-base">Price Range</h3>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-2 font-medium">
                <span>$0</span>
                <span>${maxPrice >= 100 ? '100+' : maxPrice}</span>
              </div>
            </div>
          </aside>

          <div className="flex-grow w-full">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-neutral-100 rounded-2xl h-72 animate-pulse"></div>
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const displayPrice = typeof item.price === 'number' 
                    ? item.price.toFixed(2) 
                    : (parseFloat(item.price) ? parseFloat(item.price).toFixed(2) : '12.99');

                  const restaurantName = item.Restaurant?.name || 
                    item.restaurant?.name || 
                    item.restaurantName || 
                    item.restaurant_name ||
                    'Orderly Gourmet Hub';

                  return (
                    <div 
                      key={item.id}
                      className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
                    >
                      <div className="h-48 overflow-hidden relative">
                        <img 
                          src={item.image_url || item.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600'} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="absolute bottom-3 right-3 bg-white w-10 h-10 rounded-full shadow-md flex items-center justify-center text-neutral-900 hover:text-orange-600 hover:scale-110 active:scale-95 transition-all cursor-pointer border border-neutral-100"
                          title="Add to Cart"
                        >
                          <PlusOutlined className="text-base" />
                        </button>
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="font-semibold text-neutral-900 text-lg tracking-tight leading-snug group-hover:text-orange-600 transition-colors">
                            {item.name}
                          </h3>
                          <span className="font-bold text-neutral-900 whitespace-nowrap">
                            ₹{displayPrice}
                          </span>
                        </div>

                        <p className="text-neutral-500 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {item.description || item.desc || 'Fresh ingredients, prepared by local top chefs and delivered hot.'}
                        </p>

                        <div className="mt-auto pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400 font-medium">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-600 font-semibold text-[11px] shrink-0">
                              {getCategoryLabel(item.category, item.cuisine_type)}
                            </span>
                            <span className="text-neutral-300 text-xs shrink-0">•</span>
                            <span className="text-neutral-600 font-extrabold text-[11px] truncate" title={restaurantName}>
                              by {restaurantName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-neutral-700 font-medium shrink-0">
                            <StarFilled className="text-yellow-400 text-xs" />
                            <span>{item.rating || '4.9'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-neutral-200/80">
                <p className="text-neutral-500 text-base font-medium">No menu items match your search or filter criteria.</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setMaxPrice(100);
                  }}
                  className="mt-4 px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {/* BREAKFAST & MORNING BANNER PROMO */}
            <div className="mt-12 relative rounded-3xl overflow-hidden shadow-xl border border-neutral-800 bg-neutral-950 text-white p-8 sm:p-10">
              <img 
                src="/food_banners/breakfast-banner.jpg" 
                alt="Fresh Breakfast Banner" 
                className="absolute inset-0 w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/55 to-neutral-950/20"></div>

              <div className="relative z-10 max-w-xl space-y-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                  ☕ Fresh Morning Delights
                </span>
                <h3 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                  "Eat breakfast like a king, lunch like a prince, and dinner like a pauper."
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 font-serif italic">
                  — Adelle Davis
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
