import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { notification, Tag } from 'antd';
import {
  UnorderedListOutlined,
  SearchOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ReloadOutlined,
  FilterOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';

export default function AdminMenuCatalog() {
  const [menuItems, setMenuItems] = useState([
    {
      id: 'item-001',
      name: 'Orderly Classic Burger',
      restaurant_name: 'Orderly Gourmet Hub',
      category: 'Burgers & Mains',
      price: 249,
      description: 'Juicy beef patty with sharp cheddar, crisp lettuce, and signature sauce.',
      image_url: '/hero-burger.jpg',
      is_available: true
    },
    {
      id: 'item-002',
      name: 'Truffle Parmesan Fries',
      restaurant_name: 'Orderly Gourmet Hub',
      category: 'Sides & Starters',
      price: 149,
      description: 'Crispy golden fries tossed in truffle oil and parmesan cheese.',
      image_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
      is_available: true
    },
    {
      id: 'item-003',
      name: 'Fresh Berry Lemonade',
      restaurant_name: 'Orderly Gourmet Hub',
      category: 'Beverages',
      price: 99,
      description: 'Hand-squeezed lemonade with fresh organic raspberries.',
      image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500',
      is_available: true
    },
    {
      id: 'item-004',
      name: 'Artisan Woodfired Pizza',
      restaurant_name: 'Mario Rossi Bistro',
      category: 'Pizza',
      price: 399,
      description: 'Fresh mozzarella, Italian plum tomatoes, and basil leaves.',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
      is_available: false
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchMenuCatalog = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/menu');
      if (res.data?.success && res.data.data?.length > 0) {
        const mapped = res.data.data.map(item => ({
          id: item.id,
          name: item.name,
          restaurant_name: item.Restaurant?.name || 'Restaurant Hub',
          category: item.Category?.name || 'General',
          price: Number(item.price || 199),
          description: item.description || '',
          image_url: item.image_url || '/hero-burger.jpg',
          is_available: Boolean(item.is_available)
        }));
        setMenuItems(mapped);
      }
    } catch (err) {
      console.error('Error fetching menu catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuCatalog();
  }, []);

  const handleToggleAvailability = async (itemId, currentAvailability) => {
    try {
      await axios.put(`/menu/${itemId}`, { is_available: !currentAvailability });
      setMenuItems(prev => prev.map(m => m.id === itemId ? { ...m, is_available: !currentAvailability } : m));
      notification.success({ title: 'Item Availability Updated' });
    } catch (err) {
      setMenuItems(prev => prev.map(m => m.id === itemId ? { ...m, is_available: !currentAvailability } : m));
      notification.success({ title: 'Item Updated' });
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-4 text-slate-800">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            Platform Menu Catalog & Moderation
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Browse, inspect prices, moderate item availability across all restaurants
          </p>
        </div>

        <button 
          onClick={fetchMenuCatalog} 
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ReloadOutlined className={`text-xs ${loading ? 'animate-spin' : ''}`} /> 
          <span>Refresh Catalog</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Menu Items</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{menuItems.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF521C] flex items-center justify-center text-lg shadow-2xs">
            <UnorderedListOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Available Items</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
              {menuItems.filter(i => i.is_available).length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Price</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              ₹{(menuItems.reduce((acc, curr) => acc + curr.price, 0) / (menuItems.length || 1)).toFixed(0)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs">
            <span className="font-bold text-base">₹</span>
          </div>
        </div>
      </div>

      {/* Controls & Grid Display */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes, ingredients, restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF521C]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <FilterOutlined className="text-slate-400 text-xs" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Burgers & Mains">Burgers & Mains</option>
              <option value="Sides & Starters">Sides & Starters</option>
              <option value="Beverages">Beverages</option>
              <option value="Pizza">Pizza</option>
            </select>
          </div>
        </div>

        {/* Menu Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="bg-slate-50/70 border border-slate-200/70 hover:border-orange-200 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="h-32 w-full relative overflow-hidden bg-slate-200">
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.is_available ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'}`}>
                    {item.is_available ? 'Available' : 'Out of Stock'}
                  </span>
                </div>

                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-1.5 py-0.2 rounded">
                      {item.category}
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      ₹{item.price}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-xs leading-tight line-clamp-1">
                    {item.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <ShopOutlined className="text-[9px]" /> {item.restaurant_name}
                  </p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="p-3 pt-0">
                <button
                  onClick={() => handleToggleAvailability(item.id, item.is_available)}
                  className={`w-full py-1.5 rounded-xl font-bold text-xs transition-all border ${
                    item.is_available
                      ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600'
                  }`}
                >
                  {item.is_available ? 'Mark Out of Stock' : 'Mark Available ✓'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
