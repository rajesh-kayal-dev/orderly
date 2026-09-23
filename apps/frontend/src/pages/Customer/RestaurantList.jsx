import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../api/axios';
import socket from '../../socket';
import { 
  StarFilled, 
  ClockCircleFilled, 
  SearchOutlined,
  ReloadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const cuisinesList = [
  { id: 'All', name: 'All Cuisines' },
  { id: 'Burgers', name: 'Burgers' },
  { id: 'Pizza', name: 'Pizza' },
  { id: 'Sushi', name: 'Sushi' },
  { id: 'Asian', name: 'Asian' },
  { id: 'Healthy', name: 'Healthy' },
  { id: 'Pasta', name: 'Pasta' },
  { id: 'Desserts', name: 'Desserts' },
];

const deliveryTimeOptions = [
  { id: 'any', label: 'Any' },
  { id: 'under_20', label: 'Under 20 mins' },
  { id: '20_40', label: '20 - 40 mins' },
  { id: 'over_40', label: 'Over 40 mins' },
];

const ratingOptions = [
  { id: 'any', label: 'Any' },
  { id: '4.5', label: '4.5+' },
  { id: '4.0', label: '4.0+' },
  { id: '3.5', label: '3.5+' },
  { id: '3.0', label: '3.0+' },
];

const fallbackRestaurants = [
  { id: 1, name: "The Burger House", cuisine_type: "Burgers • Fast Food", address: "123 MG Road, Indore", rating: 4.8, delivery_time: "25 - 35 min", is_open: true, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=600" },
  { id: 2, name: "Pizza Palace", cuisine_type: "Pizza • Italian • Fast Food", address: "456 Vijay Nagar, Indore", rating: 4.6, delivery_time: "20 - 30 min", is_open: true, image_url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600" },
  { id: 3, name: "Sushi World", cuisine_type: "Sushi • Japanese • Asian", address: "789 Sapna Sangeeta, Indore", rating: 4.7, delivery_time: "30 - 45 min", is_open: true, image_url: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=600" },
  { id: 4, name: "Pasta Point", cuisine_type: "Pasta • Italian • Continental", address: "321 AB Road, Indore", rating: 4.5, delivery_time: "25 - 40 min", is_open: true, image_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=600" },
  { id: 5, name: "Green Bowl", cuisine_type: "Healthy • Salads • Bowls", address: "654 Scheme 54, Indore", rating: 4.6, delivery_time: "20 - 35 min", is_open: true, image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=600" },
  { id: 6, name: "Sweet Cravings", cuisine_type: "Desserts • Bakery • Beverages", address: "987 Nehru Nagar, Indore", rating: 4.4, delivery_time: "15 - 25 min", is_open: true, image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=600" },
  { id: 7, name: "Asian Kitchen", cuisine_type: "Asian • Chinese • Thai", address: "147 Palasia, Indore", rating: 4.5, delivery_time: "25 - 40 min", is_open: true, image_url: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&q=80&w=600" },
  { id: 8, name: "Spice Garden", cuisine_type: "Indian • North Indian • Chinese", address: "258 RNT Marg, Indore", rating: 4.3, delivery_time: "30 - 50 min", is_open: true, image_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600" },
  { id: 9, name: "Cafe Mocha", cuisine_type: "Beverages • Snacks • Continental", address: "369 City Centre, Indore", rating: 4.6, delivery_time: "15 - 30 min", is_open: true, image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600" },
];

export default function RestaurantList() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchParam = queryParams.get('search') || '';
  const categoryParam = queryParams.get('category') || 'All';

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [selectedCuisine, setSelectedCuisine] = useState(categoryParam);
  const [maxPrice, setMaxPrice] = useState(50);
  const [deliveryTime, setDeliveryTime] = useState('any');
  const [selectedRating, setSelectedRating] = useState('any');
  const [sortBy, setSortBy] = useState('recommended');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/restaurants');
        if (response.data.success && response.data.data?.length > 0) {
          setRestaurants(response.data.data);
        } else {
          setRestaurants(fallbackRestaurants);
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        setRestaurants(fallbackRestaurants);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const handleRestaurantStatusUpdated = (data) => {
      setRestaurants((prev) => prev.map((restaurant) => (
        String(restaurant.id) === String(data.restaurantId)
          ? { ...restaurant, is_open: data.is_open }
          : restaurant
      )));
    };

    socket.on('RESTAURANT_STATUS_UPDATED', handleRestaurantStatusUpdated);
    return () => socket.off('RESTAURANT_STATUS_UPDATED', handleRestaurantStatusUpdated);
  }, []);

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCuisine('All');
    setMaxPrice(50);
    setDeliveryTime('any');
    setSelectedRating('any');
    setSortBy('recommended');
  };

  const formatAddress = (addr) => {
    if (!addr) return 'Central City Area';
    if (addr.includes('123 Flavor Street')) return 'Central City Area';
    return addr;
  };

  // Filter restaurants dynamically
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch = !searchTerm || 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (restaurant.cuisine_type && restaurant.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCuisine = selectedCuisine === 'All' || 
      (restaurant.cuisine_type && restaurant.cuisine_type.toLowerCase().includes(selectedCuisine.toLowerCase()));

    const numRating = parseFloat(restaurant.rating) || 4.5;
    const matchesRating = selectedRating === 'any' || numRating >= parseFloat(selectedRating);

    return matchesSearch && matchesCuisine && matchesRating;
  });

  return (
    <div className="pb-16 animate-fade-in -mt-16">
      
      {/* 1. DARK HERO BANNER (Restaurants) */}
      <div className="bg-neutral-900 text-white pt-24 pb-16 border-b border-neutral-800 relative overflow-hidden">
        {/* Gourmet Banner Background */}
        <img 
          src="/food_banners/gourmet-banner-2.jpg" 
          alt="Gourmet Partner Background" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              🍴 Certified Partners
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Restaurants</h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Discover amazing restaurants near you, serving fresh and delicious food.
            </p>
          </div>

          <div className="hidden lg:block text-right pr-6">
            <span className="font-serif italic text-amber-400 text-2xl font-bold tracking-wide transform rotate-[-3deg] block drop-shadow-md">
              "Good Food, Brighter Days ✨"
            </span>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
              Freshly Prepared • Delivered Fast
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (Sidebar + Cards) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT SIDEBAR FILTERS */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm">
            
            {/* Search Input Box */}
            <div>
              <div className="relative">
                <SearchOutlined className="absolute left-3.5 top-3 text-neutral-400 text-base" />
                <input 
                  type="text" 
                  placeholder="Search restaurants..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Cuisines Filter */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-3 text-sm">Cuisines</h3>
              <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {cuisinesList.map((c) => {
                  const isChecked = selectedCuisine === c.id;
                  return (
                    <label 
                      key={c.id} 
                      onClick={() => setSelectedCuisine(c.id)}
                      className="flex items-center gap-2.5 cursor-pointer group select-none"
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center text-white transition-all ${
                        isChecked 
                          ? 'bg-orange-500 border-orange-500 shadow-sm shadow-orange-500/20' 
                          : 'bg-white border-neutral-300 group-hover:border-orange-500'
                      }`}>
                        {isChecked && <span className="text-[10px] font-black">✓</span>}
                      </div>
                      <span className={`text-xs transition-colors ${
                        isChecked ? 'font-semibold text-neutral-900' : 'text-neutral-600 group-hover:text-neutral-900'
                      }`}>
                        {c.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-3 text-sm">Price Range</h3>
              <input 
                type="range" 
                min="0" 
                max="50" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-2 font-medium">
                <span>$0</span>
                <span>${maxPrice >= 50 ? '50+' : maxPrice}</span>
              </div>
            </div>

            {/* Delivery Time */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-3 text-sm">Delivery Time</h3>
              <div className="space-y-2">
                {deliveryTimeOptions.map((opt) => {
                  const isChecked = deliveryTime === opt.id;
                  return (
                    <label 
                      key={opt.id}
                      onClick={() => setDeliveryTime(opt.id)}
                      className="flex items-center gap-2.5 cursor-pointer group select-none"
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center text-white transition-all ${
                        isChecked 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'bg-white border-neutral-300 group-hover:border-orange-500'
                      }`}>
                        {isChecked && <span className="text-[10px] font-black">✓</span>}
                      </div>
                      <span className={`text-xs ${isChecked ? 'font-semibold text-neutral-900' : 'text-neutral-600'}`}>
                        {opt.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="font-semibold text-neutral-900 mb-3 text-sm">Rating</h3>
              <div className="space-y-2">
                {ratingOptions.map((r) => {
                  const isChecked = selectedRating === r.id;
                  return (
                    <label 
                      key={r.id}
                      onClick={() => setSelectedRating(r.id)}
                      className="flex items-center gap-2.5 cursor-pointer group select-none"
                    >
                      <div className={`w-4 h-4 border rounded-full flex items-center justify-center text-white transition-all ${
                        isChecked 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'bg-white border-neutral-300 group-hover:border-orange-500'
                      }`}>
                        {isChecked && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                      </div>
                      <span className="text-xs text-neutral-600 flex items-center gap-1">
                        {r.id !== 'any' && <StarFilled className="text-amber-400 text-[11px]" />}
                        <span className={isChecked ? 'font-semibold text-neutral-900' : ''}>{r.label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Clear Filters Button */}
            <button 
              onClick={clearAllFilters}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-neutral-200/80"
            >
              <ReloadOutlined className="text-xs" />
              <span>Clear Filters</span>
            </button>

          </aside>

          {/* RIGHT CONTENT SECTION */}
          <div className="flex-grow w-full space-y-6">
            
            {/* Top Bar Header (Count + Sort) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-neutral-200/80 shadow-sm">
              <p className="text-sm font-medium text-neutral-700">
                Showing <span className="font-bold text-neutral-900">{filteredRestaurants.length}</span> restaurants near you
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-medium">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="fastest">Fastest Delivery</option>
                </select>
              </div>
            </div>

            {/* RESTAURANT CARDS GRID */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-neutral-100 rounded-2xl h-72 animate-pulse"></div>
                ))}
              </div>
            ) : filteredRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <div 
                    key={restaurant.id}
                    onClick={() => navigate(`/customer/restaurant/${restaurant.id}`)}
                    className="group cursor-pointer bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Top Image Box */}
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600'} 
                        alt={restaurant.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top-Left Delivery Time Badge */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-neutral-800 flex items-center gap-1 shadow-sm">
                        <ClockCircleFilled className="text-neutral-700 text-xs" />
                        <span>{restaurant.delivery_time || '25 - 35 min'}</span>
                      </div>

                      {/* Top-Right Rating Badge */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-neutral-800 flex items-center gap-1 shadow-sm">
                        <StarFilled className="text-amber-400 text-xs" />
                        <span>{restaurant.rating || '4.8'}</span>
                      </div>

                      {/* Bottom-Left Store Status Badge */}
                      <div className={`absolute bottom-3 left-3 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm border ${
                        (restaurant.is_open ?? restaurant.is_active ?? true)
                          ? 'bg-emerald-500/90 text-white border-emerald-400'
                          : 'bg-rose-600/90 text-white border-rose-500'
                      }`}>
                        <span>{(restaurant.is_open ?? restaurant.is_active ?? true) ? '● OPEN' : '● CLOSED'}</span>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-4 bg-white flex flex-col flex-grow justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-neutral-900 text-base group-hover:text-orange-600 transition-colors leading-tight mb-1">
                          {restaurant.name}
                        </h3>
                        <p className="text-xs text-neutral-500 font-medium truncate">
                          {restaurant.cuisine_type || 'Burgers • Fast Food'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                        <span className="text-neutral-400 font-medium truncate max-w-[150px] flex items-center gap-1">
                          📍 {formatAddress(restaurant.address)}
                        </span>
                        <span className="text-orange-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Explore <ArrowRightOutlined className="text-[10px]" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200/80 shadow-sm">
                <p className="text-neutral-500 text-base font-medium">No restaurants match your filter criteria.</p>
                <button 
                  onClick={clearAllFilters}
                  className="mt-4 px-5 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
