import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import SectionHeader from '../../components/common/SectionHeader';
import { 
  ArrowRightOutlined, 
  CheckCircleFilled, 
  ClockCircleOutlined,
  ClockCircleFilled, 
  StarFilled, 
  ThunderboltFilled,
  EnvironmentOutlined
} from '@ant-design/icons';

const categories = [
  { id: 'Burger', name: 'Burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=500' },
  { id: 'Pizza', name: 'Pizza', img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=500' },
  { id: 'Sushi', name: 'Sushi', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=500' },
  { id: 'Asian', name: 'Asian', img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=500' },
  { id: 'Healthy', name: 'Healthy', img: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=500' },
  { id: 'Pasta', name: 'Pasta', img: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&q=80&w=500' },
];

export default function Dashboard() {
  const { user } = useSelector(state => state.auth);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopRestaurants = async () => {
      try {
        const response = await axios.get('/restaurants');
        if (response.data.success) {
          setRestaurants((response.data.data || []).slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching top restaurants:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopRestaurants();
  }, []);

  const handleCategoryClick = (catId) => {
    navigate(`/customer/restaurants?category=${encodeURIComponent(catId)}`);
  };

  const formatAddress = (addr) => {
    if (!addr) return 'Local Favorite';
    if (addr.includes('123 Flavor Street')) return 'Central City Area';
    return addr;
  };

  return (
    <div className="pb-16 animate-fade-in space-y-16">
      
      {/* 1. HERO SECTION - Exact QuickBite Template Pick */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-br from-orange-50 via-white to-red-50 -mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column Content */}
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                No delivery fees on first order
              </div>

              <h1 className="text-5xl lg:text-7xl font-semibold tracking-tight text-neutral-900 leading-[1.1]">
                Delicious food delivered <span className="text-orange-600 font-semibold">fast</span> to your door.
              </h1>

              <p className="text-lg text-neutral-500 max-w-lg leading-relaxed font-normal">
                Craving something specific? Orderly connects you with the best local restaurants for instant satisfaction. Fresh, hot, and right on time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/customer/restaurants')}
                  className="px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl shadow-lg shadow-orange-200 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2 group"
                >
                  <span>Order Now</span>
                  <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button 
                  onClick={() => navigate('/customer/restaurants')}
                  className="px-8 py-3.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-900 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  View Restaurants
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 flex items-center gap-6 text-sm text-neutral-500 font-medium border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <CheckCircleFilled className="text-green-500 text-base" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleFilled className="text-green-500 text-base" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleFilled className="text-green-500 text-base" />
                  <span>Real-time Tracking</span>
                </div>
              </div>
            </div>

            {/* Right Column Image Banner */}
            <div className="relative lg:h-[600px] flex items-center justify-center animate-slide-up">
              {/* Abstract Bg Blob */}
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-200/40 to-red-200/40 rounded-full blur-3xl transform scale-75"></div>
              
              <img 
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1000" 
                alt="Delicious Pizza" 
                className="relative z-10 rounded-2xl shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-700 object-cover w-full h-auto max-w-md mx-auto aspect-[4/5]"
              />

              {/* Floating Badge */}
              <div className="absolute bottom-10 -left-4 md:left-10 bg-white p-4 rounded-xl shadow-xl z-20 flex items-center gap-3 animate-float">
                <div className="bg-green-100 p-2.5 rounded-full text-green-600 flex items-center justify-center">
                  <ClockCircleOutlined className="text-xl" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase">Delivery Time</p>
                  <p className="text-sm font-semibold text-neutral-900">25-30 Mins</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* INNER CONTENT WRAPPER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        
        {/* 2. POPULAR CATEGORIES SECTION */}
        <section className="py-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Popular Categories</h2>
              <p className="text-neutral-500 mt-1 text-sm">Explore our most ordered food types.</p>
            </div>
            <button 
              onClick={() => navigate('/customer/restaurants')}
              className="hidden md:flex items-center text-orange-600 hover:text-orange-700 font-medium text-sm gap-1 transition-colors"
            >
              See all <ArrowRightOutlined className="text-xs" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <div 
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="group cursor-pointer"
              >
                <div className="aspect-square rounded-2xl bg-neutral-50 border border-neutral-100 overflow-hidden relative mb-3 group-hover:border-orange-200 transition-colors">
                  <img 
                    src={cat.img} 
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                <h3 className="text-center font-medium text-neutral-900 group-hover:text-orange-600 transition-colors text-sm">
                  {cat.name}
                </h3>
              </div>
            ))}
          </div>
        </section>

        {/* SPICE & FLAVORS FEATURE BANNER */}
        <section className="relative rounded-3xl overflow-hidden shadow-lg border border-neutral-800 bg-neutral-950 text-white p-8 sm:p-12">
          <img 
            src="/food_banners/spices-banner.jpg" 
            alt="Spices & Flavors" 
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30"></div>

          <div className="relative z-10 max-w-xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider border border-orange-500/30">
              🌶️ Authentic Flavors
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              "Spice is the variety of life, and food is its heart."
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 font-serif italic">
              Explore hand-picked authentic culinary creations prepared by top local chefs.
            </p>
          </div>
        </section>

        {/* 3. POPULAR NEAR YOU (RESTAURANTS) */}
        <section className="space-y-6">
          <SectionHeader 
            title="Popular Near You" 
            subtitle="Top rated restaurants ready to serve you"
            actionText="Browse all"
            onAction={() => navigate('/customer/restaurants')}
          />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-neutral-100 rounded-3xl h-64 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {restaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  onClick={() => navigate(`/customer/restaurant/${restaurant.id}`)}
                  className="group bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-300 cursor-pointer flex flex-col w-full max-w-sm"
                >
                  {/* Image & Badges */}
                  <div className="h-48 sm:h-52 overflow-hidden relative">
                    <img
                      src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-md text-xs font-black text-neutral-800 flex items-center gap-1">
                      <StarFilled className="text-amber-400 text-xs" />
                      <span>{restaurant.rating || '4.8'}</span>
                    </div>

                    {/* Delivery Time Badge */}
                    <div className="absolute bottom-3 left-3 bg-neutral-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <ClockCircleFilled className="text-orange-400" />
                      <span>25 - 35 min</span>
                    </div>
                  </div>

                  {/* Info Container */}
                  <div className="p-5 flex flex-col flex-grow justify-between space-y-4">
                    <div>
                      <h3 className="font-extrabold text-neutral-900 text-lg group-hover:text-orange-600 transition-colors leading-tight mb-1">
                        {restaurant.name}
                      </h3>
                      <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
                        {restaurant.cuisine_type || 'INTERNATIONAL'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-500 font-medium">
                      <span className="flex items-center gap-1 text-neutral-600 font-semibold truncate max-w-[180px]">
                        <EnvironmentOutlined className="text-orange-500" />
                        {formatAddress(restaurant.address)}
                      </span>
                      <span className="text-orange-600 font-extrabold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 flex-shrink-0">
                        Explore <ArrowRightOutlined />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. WHAT OUR CUSTOMERS SAY (TESTIMONIALS) */}
        <section className="py-12 bg-neutral-50 border-t border-neutral-200/80 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 text-center mb-10">What our customers say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
              <div className="flex gap-1 text-orange-500 mb-4 text-sm">
                <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
              </div>
              <p className="text-neutral-600 mb-6 leading-relaxed text-sm">
                "The delivery was incredibly fast and the food was still hot. The app interface is so clean and easy to use. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-semibold text-xs border border-neutral-200">
                  JS
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">James Smith</p>
                  <p className="text-xs text-neutral-500">Food Lover</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
              <div className="flex gap-1 text-orange-500 mb-4 text-sm">
                <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
              </div>
              <p className="text-neutral-600 mb-6 leading-relaxed text-sm">
                "Orderly has revolutionized my lunch breaks. The variety of healthy options and reliable delivery times are unmatched."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-semibold text-xs border border-neutral-200">
                  ED
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Elena Davis</p>
                  <p className="text-xs text-neutral-500">Corporate Designer</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
              <div className="flex gap-1 text-orange-500 mb-4 text-sm">
                <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
              </div>
              <p className="text-neutral-600 mb-6 leading-relaxed text-sm">
                "Best customer service I've experienced. Had a small issue with an order and they fixed it within minutes. 5 stars."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 font-semibold text-xs border border-neutral-200">
                  MR
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Michael Ross</p>
                  <p className="text-xs text-neutral-500">Local Guide</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 5. GOURMET FEATURED BANNER SECTION */}
        <section className="relative rounded-3xl overflow-hidden shadow-2xl border border-neutral-800 bg-gradient-to-r from-neutral-950 via-neutral-900 to-slate-950 text-white p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-1/2 right-12 -translate-y-1/2 w-80 h-80 bg-orange-600/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-extrabold uppercase tracking-widest border border-orange-500/30">
              ⚡ ORDERLY EXPRESS
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              "Hot food. Fast wheels. Perfectly Orderly."
            </h2>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed font-medium">
              Freshly cooked by top local kitchens, delivered hot to your door.
            </p>

            <div className="pt-2">
              <button 
                onClick={() => navigate('/customer/menu')}
                className="px-8 py-3.5 bg-[#FF521C] hover:bg-[#E04310] text-white font-extrabold rounded-xl shadow-lg shadow-orange-600/30 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Explore Gourmet Menu</span>
                <ArrowRightOutlined className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Side Illustration: Orderly Delivery Bike */}
          <div className="relative shrink-0 w-full lg:w-auto flex justify-center z-10">
            <img 
              src="/brand_foods/brand_with bike.png" 
              alt="Orderly Bike Delivery" 
              className="max-h-64 sm:max-h-72 lg:max-h-80 w-auto object-contain drop-shadow-2xl animate-float"
            />
          </div>
        </section>

      </div>

    </div>
  );
}
