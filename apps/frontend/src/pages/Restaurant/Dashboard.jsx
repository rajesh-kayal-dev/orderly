import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import socket from '../../socket';
import { notification } from 'antd';
import { loginSuccess } from '../../redux/slices/authSlice';
import {
  ShoppingOutlined,
  DollarOutlined,
  UserOutlined,
  StarOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  RightOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CarOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

export default function RestaurantDashboard() {
  const { profile, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  // Live Date & Time State for Minimal Display
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/restaurants/my-profile');
        if (res.data?.success && res.data?.data) {
          const freshProfile = res.data.data;
          dispatch(loginSuccess({
            user,
            profile: { ...profile, ...freshProfile },
            token: localStorage.getItem('token') || sessionStorage.getItem('token')
          }));
        }
      } catch (_) {}
    };
    fetchProfile();
  }, [user?.id]);

  const restaurantName = profile?.name || (user?.full_name ? `${user.full_name}'s Restaurant` : 'My Restaurant');
  const ownerName = user?.full_name || profile?.owner_name || 'Partner';

  const fetchData = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let ordersData = [];
      try {
        const res = await axios.get('/orders/restaurant/me');
        if (res.data?.success) ordersData = res.data.data || [];
      } catch (err) {
        try {
          const fallbackRes = await axios.get(`/orders?restaurantId=${profile.id}`);
          if (fallbackRes.data?.success) ordersData = fallbackRes.data.data || fallbackRes.data.orders || [];
        } catch (fErr) {
          ordersData = [];
        }
      }
      setOrders(ordersData);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile && profile.id) {
      fetchData();

      socket.connect();
      socket.emit('join', user.id);

      const handleNewOrder = (data) => {
        notification.success({
          title: 'New Order Received!',
          description: `Order #${data.orderId.slice(0, 8)} has arrived.`,
          placement: 'topRight',
        });
        fetchData();
      };

      const handleStatusUpdate = () => fetchData();

      socket.on('NEW_ORDER', handleNewOrder);
      socket.on('ORDER_STATUS_UPDATED', handleStatusUpdate);

      return () => {
        socket.off('NEW_ORDER', handleNewOrder);
        socket.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
      };
    } else {
      const timer = setTimeout(() => {
        if (!profile?.id) setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [profile, user]);

  const getFilteredOrders = (status) => {
    return orders.filter(o => {
      if (status === 'pending') return o.status === 'pending';
      if (status === 'accepted') return o.status === 'accepted';
      if (status === 'preparing') return o.status === 'preparing';
      if (status === 'on_the_way') return o.status === 'picked_up' || o.status === 'delivering';
      if (status === 'delivered') return o.status === 'delivered' || o.status === 'completed';
      if (status === 'cancelled') return o.status === 'cancelled';
      return true;
    });
  };

  const counts = {
    pending: getFilteredOrders('pending').length,
    accepted: getFilteredOrders('accepted').length,
    preparing: getFilteredOrders('preparing').length,
    on_the_way: getFilteredOrders('on_the_way').length,
    delivered: getFilteredOrders('delivered').length,
    cancelled: getFilteredOrders('cancelled').length,
  };

  const currentTabOrders = getFilteredOrders(activeTab);

  // Calculations for stats
  const totalOrdersCount = orders.length;
  const todayRevenue = orders
    .filter(o => o.status === 'delivered' || o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const uniqueCustomersCount = new Set(orders.map(o => o.customer_id)).size;
  const ratingValue = profile?.rating ? Number(profile.rating).toFixed(1) : '5.0';

  // Minimal Natural Formatting for Date & Time
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto animate-fade-in text-slate-800">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-[#FFF5EE] via-[#FFEADB] to-[#FED7AA] rounded-2xl p-4 md:p-5 border border-orange-100/80 shadow-xs relative overflow-hidden flex items-center justify-between gap-4">
        {/* Left Greeting Text */}
        <div className="max-w-md z-10">
          <p className="text-slate-500 font-semibold text-xs mb-0.5 flex items-center gap-1.5">
            <span>Welcome back, {ownerName}!</span>
            <span className="inline-block">👋</span>
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-2">
            <span>{restaurantName}</span>
            <span className="text-orange-500 text-lg">✨</span>
          </h2>
          <p className="text-slate-600 text-xs leading-normal mb-3 font-medium">
            Manage your orders, menu, and grow your restaurant with Orderly.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/restaurant/menu')}
              className="bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 group transition-all"
            >
              <span>Keep Serving Great Food</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Minimal & Natural Live Date & Time Display */}
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-orange-100/80 text-xs shadow-2xs">
              <ClockCircleOutlined className="text-orange-500 text-xs" />
              <span className="font-semibold text-slate-700">{formattedDate}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-900">{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Right 3D Food Artwork */}
        <div className="relative z-10 flex items-center shrink-0">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white/90 bg-white">
            <img
              src="/hero-burger.jpg"
              alt="Great Food with Orderly"
              className="h-32 md:h-36 w-auto object-cover"
            />
            <div className="absolute bottom-1 right-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded-md shadow-xs uppercase tracking-tight">
              Great Food Happier People!
            </div>
          </div>
        </div>
      </div>

      {/* 4 Compact Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL ORDERS</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{totalOrdersCount}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +0% today</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF521C] flex items-center justify-center text-lg shadow-2xs shrink-0">
            <ShoppingOutlined />
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TODAY'S REVENUE</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">₹{todayRevenue.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +0% today</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <DollarOutlined />
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL CUSTOMERS</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{uniqueCustomersCount}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +0% today</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <UserOutlined />
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AVERAGE RATING</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{ratingValue}</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Based on customer reviews</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <StarOutlined />
          </div>
        </div>
      </div>

      {/* Main Grid Section: Orders (2 cols) & Widgets (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Orders Status Section (Left 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xs p-4 flex flex-col justify-between">
          {/* Order Tabs */}
          <div className="border-b border-slate-100 pb-2 mb-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {[
                { key: 'pending', label: 'Pending', icon: <ClockCircleOutlined /> },
                { key: 'accepted', label: 'Accepted', icon: <CheckCircleOutlined /> },
                { key: 'preparing', label: 'Preparing', icon: <SyncOutlined /> },
                { key: 'on_the_way', label: 'On the way', icon: <CarOutlined /> },
                { key: 'delivered', label: 'Delivered', icon: <CheckCircleOutlined /> },
                { key: 'cancelled', label: 'Cancelled', icon: <CloseCircleOutlined /> }
              ].map(tab => {
                const isActive = activeTab === tab.key;
                const count = counts[tab.key] || 0;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                      isActive
                        ? 'text-[#FF521C] bg-orange-50/80 border-b-2 border-[#FF521C]'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                        isActive
                          ? 'bg-[#FF521C] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Table / Empty State */}
          <div className="min-h-[200px] flex flex-col items-center justify-center">
            {loading ? (
              <div className="py-8 text-center text-slate-400 flex flex-col items-center">
                <SyncOutlined spin className="text-2xl text-orange-500 mb-2 opacity-50" />
                <p className="text-xs font-bold">Loading orders...</p>
              </div>
            ) : currentTabOrders.length > 0 ? (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Items</th>
                      <th className="py-2 px-3">Total</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTabOrders.map(o => (
                      <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors text-xs">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {o.customer?.user?.full_name || o.Customer?.User?.full_name || o.customer_name || 'Customer'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {(o.items || o.OrderItems || []).length || 1} items
                        </td>
                        <td className="py-2.5 px-3 font-black text-slate-900">
                          ₹{Number(o.total_amount || o.subtotal || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => navigate('/restaurant/orders')}
                            className="text-xs font-bold text-[#FF521C] hover:underline"
                          >
                            Manage →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Clipboard Empty State */
              <div className="py-6 flex flex-col items-center text-center">
                <img
                  src="/empty-clipboard.jpg"
                  alt="No pending orders"
                  className="w-20 h-20 object-contain mb-2 filter drop-shadow-sm"
                />
                <h4 className="text-slate-900 font-bold text-sm mb-0.5">
                  No {activeTab} orders
                </h4>
                <p className="text-slate-400 text-xs mb-3">
                  When new orders arrive, they will appear here.
                </p>
                <button
                  onClick={() => navigate('/restaurant/menu')}
                  className="bg-[#FF521C] hover:bg-[#E04310] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1 transition-all"
                >
                  <span>Browse Menu</span>
                  <RightOutlined className="text-[9px]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Widgets */}
        <div className="space-y-4">
          {/* Quick Actions Widget */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Quick Actions</h3>
              <button
                onClick={() => navigate('/restaurant/menu')}
                className="text-[11px] font-bold text-[#FF521C] hover:underline flex items-center gap-0.5"
              >
                <span>See All</span>
                <RightOutlined className="text-[8px]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Add Menu Item */}
              <button
                onClick={() => navigate('/restaurant/menu')}
                className="p-2.5 rounded-xl bg-orange-50/70 hover:bg-orange-100/70 border border-orange-100/60 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#FF521C] text-white flex items-center justify-center text-xs font-bold mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                  <PlusCircleOutlined />
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Add Menu Item</p>
                <p className="text-[9px] text-slate-400 font-medium">Grow your menu</p>
              </button>

              {/* View Menu */}
              <button
                onClick={() => navigate('/restaurant/menu')}
                className="p-2.5 rounded-xl bg-orange-50/70 hover:bg-orange-100/70 border border-orange-100/60 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                  <UnorderedListOutlined />
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">View Menu</p>
                <p className="text-[9px] text-slate-400 font-medium">Manage items</p>
              </button>

              {/* Business Hours */}
              <button
                onClick={() => navigate('/restaurant/settings')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center text-xs font-bold mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                  <ClockCircleOutlined />
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Business Hours</p>
                <p className="text-[9px] text-slate-400 font-medium">Set availability</p>
              </button>

              {/* View Analytics */}
              <button
                onClick={() => navigate('/restaurant/summary')}
                className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100/60 border border-blue-100/50 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                  <BarChartOutlined />
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">View Analytics</p>
                <p className="text-[9px] text-slate-400 font-medium">Track performance</p>
              </button>
            </div>
          </div>

          {/* Today's Performance Widget */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Today's Performance</h3>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md cursor-pointer">
                <span>Today</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF521C] flex items-center justify-center font-bold text-xs">
                    <ShoppingOutlined />
                  </div>
                  <span className="font-semibold text-slate-700">Orders</span>
                </div>
                <span className="font-black text-slate-900 text-xs">{totalOrdersCount}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    <DollarOutlined />
                  </div>
                  <span className="font-semibold text-slate-700">Revenue</span>
                </div>
                <span className="font-black text-slate-900 text-xs">₹{todayRevenue.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <UserOutlined />
                  </div>
                  <span className="font-semibold text-slate-700">New Customers</span>
                </div>
                <span className="font-black text-slate-900 text-xs">{uniqueCustomersCount}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-xs">
                    <StarOutlined />
                  </div>
                  <span className="font-semibold text-slate-700">Avg. Rating</span>
                </div>
                <span className="font-black text-slate-900 text-xs">{ratingValue}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
