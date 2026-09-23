import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  UserOutlined,
  ShopOutlined,
  TeamOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  UnorderedListOutlined,
  ShoppingOutlined,
  DownOutlined,
  FileTextOutlined,
  SyncOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
  const { token } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  // Calculations & Fallbacks
  const totalUsers = stats?.totalUsers || 10;
  const activeRestaurants = stats?.activeRestaurants || 2;
  const deliveryPartners = stats?.deliveryPartners || 3;
  const totalRevenue = stats?.totalRevenue || 0;
  const grandTotalUsers = totalUsers + activeRestaurants + deliveryPartners;

  // Order Trends Data (Last 7 Days)
  const orderTrendsData = [
    { day: 'Jan 01', orders: 15 },
    { day: 'Jan 02', orders: 20 },
    { day: 'Jan 03', orders: 25 },
    { day: 'Jan 04', orders: 18 },
    { day: 'Jan 05', orders: 26 },
    { day: 'Jan 06', orders: 21 },
    { day: 'Jan 07', orders: 34 },
  ];

  // User Distribution Data (Donut Chart)
  const userDistributionData = [
    { name: 'Customers', value: totalUsers, color: '#3B82F6', percentage: ((totalUsers / grandTotalUsers) * 100).toFixed(1) },
    { name: 'Restaurants', value: activeRestaurants, color: '#EF4444', percentage: ((activeRestaurants / grandTotalUsers) * 100).toFixed(1) },
    { name: 'Delivery Partners', value: deliveryPartners, color: '#06B6D4', percentage: ((deliveryPartners / grandTotalUsers) * 100).toFixed(1) },
  ];

  if (loading) return (
    <div className="py-20 text-center flex flex-col items-center">
      <SyncOutlined spin className="text-2xl text-[#FF521C] mb-3 opacity-60" />
      <p className="text-slate-400 font-bold text-xs">Loading Admin Dashboard...</p>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-3.5 text-slate-800">
      
      {/* 1. Top Hero Greeting Banner (Matching Reference Screenshot) */}
      <div className="bg-gradient-to-r from-[#FFF5EE] via-[#FFEADB] to-[#FED7AA] rounded-2xl p-4 md:p-5 border border-orange-100/80 shadow-xs relative overflow-hidden flex items-center justify-between gap-4 w-full">
        {/* Left Greeting Text */}
        <div className="z-10 max-w-lg">
          <p className="text-slate-500 font-semibold text-xs mb-0.5">Welcome Back,</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-1.5">
            <span>Super Admin!</span>
            <span className="inline-block">👋</span>
          </h2>
          <p className="text-slate-600 text-xs leading-normal font-medium">
            Here's what's happening with Orderly today.
          </p>
        </div>

        {/* Right 3D Artwork & Cursive Tagline */}
        <div className="relative z-10 hidden sm:flex items-center gap-4 shrink-0">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white/90 bg-white">
            <img
              src="/hero-burger.jpg"
              alt="Orderly Gourmet Food"
              className="h-28 md:h-32 w-auto object-cover"
            />
          </div>
          <div className="font-handwriting text-xl md:text-2xl text-orange-600 font-bold tracking-wide rotate-[-4deg] select-none">
            Good Food <br />
            Brighter Days ~
          </div>
        </div>
      </div>

      {/* 2. 4 Metric KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between relative overflow-hidden group">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalUsers}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +12% this month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF521C] flex items-center justify-center text-lg shadow-2xs shrink-0">
            <TeamOutlined />
          </div>
        </div>

        {/* Active Restaurants */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between relative overflow-hidden group">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Restaurants</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{activeRestaurants}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +0% this month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <ShopOutlined />
          </div>
        </div>

        {/* Delivery Partners */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between relative overflow-hidden group">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Partners</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{deliveryPartners}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +50% this month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <CarOutlined />
          </div>
        </div>

        {/* Platform Revenue */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between relative overflow-hidden group">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Revenue</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">₹{totalRevenue.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +0% this month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <span className="font-bold text-base">₹</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Quick Management (Left 4 Action Cards) & Today's Overview (Right Box) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* Quick Management 4 Cards (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Quick Management
            </h3>
            <Link to="/admin/users" className="text-[11px] font-bold text-[#FF521C] hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <RightOutlined className="text-[8px]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Manage Users Card */}
            <div 
              onClick={() => navigate('/admin/users')}
              className="bg-[#FFF3EC] hover:bg-[#FFEADB] border border-orange-100 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between h-28 group shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#FF521C] text-white flex items-center justify-center text-sm shadow-2xs">
                  <UserOutlined />
                </div>
                <div className="w-6 h-6 rounded-full bg-white text-slate-600 group-hover:bg-[#FF521C] group-hover:text-white flex items-center justify-center text-xs transition-colors shadow-2xs">
                  <RightOutlined className="text-[9px]" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">Manage Users</h4>
                <p className="text-[10px] text-slate-500 leading-tight">
                  View, edit and manage all platform users
                </p>
              </div>
            </div>

            {/* Manage Restaurants Card */}
            <div 
              onClick={() => navigate('/admin/pending-approvals')}
              className="bg-[#FFEAEA] hover:bg-[#FFDDDD] border border-rose-100 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between h-28 group shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm shadow-2xs">
                  <ShopOutlined />
                </div>
                <div className="w-6 h-6 rounded-full bg-white text-slate-600 group-hover:bg-rose-500 group-hover:text-white flex items-center justify-center text-xs transition-colors shadow-2xs">
                  <RightOutlined className="text-[9px]" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">Manage Restaurants</h4>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Approve, deactivate or update restaurant details
                </p>
              </div>
            </div>

            {/* Manage Delivery Partners Card */}
            <div 
              onClick={() => navigate('/admin/drivers')}
              className="bg-[#EDF5FF] hover:bg-[#E2EFFF] border border-blue-100 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between h-28 group shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center text-sm shadow-2xs">
                  <CarOutlined />
                </div>
                <div className="w-6 h-6 rounded-full bg-white text-slate-600 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center text-xs transition-colors shadow-2xs">
                  <RightOutlined className="text-[9px]" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">Manage Delivery Partners</h4>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Track, verify and support delivery partners
                </p>
              </div>
            </div>

            {/* Manage Menu Catalog Card */}
            <div 
              onClick={() => navigate('/admin/menu')}
              className="bg-[#EAFBF3] hover:bg-[#DDF8EC] border border-emerald-100 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between h-28 group shadow-2xs"
            >
              <div className="flex items-start justify-between">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-sm shadow-2xs">
                  <UnorderedListOutlined />
                </div>
                <div className="w-6 h-6 rounded-full bg-white text-slate-600 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-xs transition-colors shadow-2xs">
                  <RightOutlined className="text-[9px]" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">Manage Menu Catalog</h4>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Browse and moderate restaurant menus
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Overview Widget (Right Box) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Today's Overview
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg cursor-pointer">
              <span>Today</span>
              <DownOutlined className="text-[8px]" />
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                  <UserOutlined />
                </div>
                <span className="font-semibold text-slate-700">New Users</span>
              </div>
              <span className="font-black text-slate-900">0</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs">
                  <ShopOutlined />
                </div>
                <span className="font-semibold text-slate-700">New Restaurants</span>
              </div>
              <span className="font-black text-slate-900">0</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs">
                  <CarOutlined />
                </div>
                <span className="font-semibold text-slate-700">New Delivery Partners</span>
              </div>
              <span className="font-black text-slate-900">0</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                  <ShoppingOutlined />
                </div>
                <span className="font-semibold text-slate-700">Total Orders</span>
              </div>
              <span className="font-black text-slate-900">0</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                  <span className="font-bold text-xs">₹</span>
                </div>
                <span className="font-semibold text-slate-700">Revenue</span>
              </div>
              <span className="font-black text-slate-900">₹0</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Order Trends + User Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* Order Trends (Bar Chart) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Order Trends
            </h3>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-lg cursor-pointer">
              <span>Last 7 Days</span>
              <DownOutlined className="text-[8px]" />
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={orderTrendsData} barSize={18} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#FFF3EC' }} />
              <Bar dataKey="orders" fill="#FF7A59" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution (Doughnut Chart) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
            User Distribution
          </h3>

          <div className="flex items-center justify-between gap-2">
            {/* Donut Chart with Center Total */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {userDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-black text-slate-900 leading-none">{grandTotalUsers}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Total Users</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-2 text-xs flex-1">
              {userDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700 text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-black text-slate-900 text-xs">
                    {item.value} <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Recent Activity
            </h3>
            <Link to="/admin/users" className="text-[11px] font-bold text-[#FF521C] hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <RightOutlined className="text-[8px]" />
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                  <ShopOutlined />
                </div>
                <span className="font-semibold text-slate-700 truncate max-w-[140px]">New restaurant "Spice House" registered</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">12 min ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                  <CheckCircleOutlined />
                </div>
                <span className="font-semibold text-slate-700 truncate max-w-[140px]">Delivery partner "Rahul" verified</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">45 min ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center text-xs">
                  <UserOutlined />
                </div>
                <span className="font-semibold text-slate-700 truncate max-w-[140px]">User "Priya Sharma" signed up</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">1 hour ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs">
                  <FileTextOutlined />
                </div>
                <span className="font-semibold text-slate-700 truncate max-w-[140px]">Menu updated at "Burger Hub"</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">2 hours ago</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
                  <CheckCircleOutlined />
                </div>
                <span className="font-semibold text-slate-700 truncate max-w-[140px]">System health check completed</span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium">3 hours ago</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
