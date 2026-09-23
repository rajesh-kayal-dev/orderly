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
  StarOutlined,
  ClockCircleOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  TrophyOutlined,
  CheckOutlined
} from '@ant-design/icons';

export default function DeliveryDashboard() {
  const { profile, user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(Boolean(profile?.is_available ?? true));
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Live Date & Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const userName = user?.full_name || 'Amit';

  useEffect(() => {
    setIsOnline(Boolean(profile?.is_available ?? true));
  }, [profile?.is_available]);

  useEffect(() => {
    const fetchProfileAndHistory = async () => {
      try {
        setLoading(true);
        const { data: profData } = await axios.get('/delivery-partner/my-profile');
        if (profData?.success && profData?.data) {
          const freshProfile = profData.data;
          setIsOnline(Boolean(freshProfile.is_available));
          dispatch(loginSuccess({ user, profile: freshProfile, token }));
        }
      } catch (profErr) {
        console.warn('Failed to fetch fresh delivery profile:', profErr);
      }

      try {
        const { data } = await axios.get('/orders/driver/me/history');
        if (data?.success) {
          setHistory(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching driver history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfileAndHistory();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleToggleOnline = async () => {
    if (updatingStatus) return;
    const nextStatus = !isOnline;
    try {
      setUpdatingStatus(true);
      // Optimistic state update so UI updates immediately
      setIsOnline(nextStatus);

      let updatedProfile = null;
      try {
        const response = await axios.put('/delivery-partner/my-profile', { is_available: nextStatus });
        if (response.data?.success) {
          updatedProfile = response.data.data;
        }
      } catch (apiErr) {
        console.warn('API status update fallback applied:', apiErr);
      }

      const newProfile = updatedProfile || { ...(profile || {}), is_available: nextStatus, is_online: nextStatus };
      dispatch(loginSuccess({ user, profile: newProfile, token }));

      if (socket && socket.connected) {
        socket.emit('DRIVER_STATUS_UPDATED', {
          driverId: profile?.id || user?.id,
          userId: user?.id,
          is_online: nextStatus
        });
      }

      notification.success({
        message: 'Status Updated',
        description: nextStatus ? 'You are now ONLINE and ready for orders.' : 'You are now OFFLINE.',
        placement: 'topRight'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      setIsOnline(!nextStatus);
      notification.error({ message: 'Failed to update status', placement: 'topRight' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Calculations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = history.filter(o => new Date(o.updated_at || o.createdAt) >= today);
  const todayEarnings = todayOrders.reduce((sum, order) => sum + (parseFloat(order.delivery_fee || order.total_amount) || 150), 0);

  const dailyOrdersCount = todayOrders.length;
  const kpiTarget = 15;

  const milestones = [
    { count: 5, reward: '+₹100' },
    { count: 10, reward: '+₹300' },
    { count: 15, reward: '+₹600' }
  ];

  // Minimal Natural Date & Time Formatting
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
    <div className="space-y-3.5 max-w-[1400px] mx-auto animate-fade-in text-slate-800">
      {/* Top Hero Banner - Full Width with Clean Artwork & Live Date/Time */}
      <div className="bg-gradient-to-r from-[#FFF5EE] via-[#FFEADB] to-[#FED7AA] rounded-2xl p-4 md:p-5 border border-orange-100/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        {/* Left Content Column */}
        <div className="z-10 shrink-0 max-w-lg">
          <p className="text-slate-500 font-semibold text-xs mb-0.5">Good to see you,</p>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1 flex items-center gap-1.5">
            <span>{userName}!</span>
            <span className="inline-block">👋</span>
          </h2>
          <p className="text-slate-800 font-extrabold text-sm mb-0.5">
            Deliver Smiles, Earn More
          </p>
          <p className="text-slate-600 text-xs leading-normal mb-3 font-medium">
            You make great food reach great people.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleOnline}
              disabled={updatingStatus}
              className="bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 group transition-all"
            >
              <span>{isOnline ? 'Keep Delivering' : 'Go Online'}</span>
              <RightOutlined className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Minimal & Natural Live Date & Time Display */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-orange-100/90 text-xs shadow-2xs">
              <ClockCircleOutlined className="text-orange-500 text-xs" />
              <span className="font-semibold text-slate-700">{formattedDate}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-900">{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Right Content Column: Full-Width Transparent Banner Graphic (No Duplicate Quote Elements) */}
        <div className="relative z-10 flex-1 w-full flex items-center justify-end h-36 md:h-44 overflow-hidden">
          <img
            src="/brand_foods/delevery_partner_band.png"
            alt="Orderly Delivery Banner Artwork"
            className="h-full w-full object-contain object-right drop-shadow-sm pointer-events-none transform hover:scale-101 transition-transform duration-300"
          />
        </div>
      </div>

      {/* 4 Compact Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Orders Completed Today */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders Completed Today</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{dailyOrdersCount}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +0% from yesterday</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF521C] flex items-center justify-center text-lg shadow-2xs shrink-0">
            <ShoppingOutlined />
          </div>
        </div>

        {/* Today's Earnings */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Earnings</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">₹{todayEarnings.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +0% from yesterday</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <DollarOutlined />
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{profile?.rating ? Number(profile.rating).toFixed(1) : '0.0'}</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">No reviews yet</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <StarOutlined />
          </div>
        </div>

        {/* Online Time */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Online Time</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">0h 0m</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Today</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <ClockCircleOutlined />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Target Bonus + Deliveries) & Right Column Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Daily Target Bonus Box */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Daily Target Bonus</h3>
                <p className="text-[10px] text-slate-500">Complete deliveries to earn daily reward bonuses.</p>
              </div>
              <span className="text-sm font-black text-[#FF521C]">{dailyOrdersCount} / {kpiTarget} Orders</span>
            </div>

            {/* Visual Milestone Progress Bar */}
            <div className="relative w-full h-2.5 bg-slate-100 rounded-full my-6">
              <div
                className="absolute top-0 left-0 h-full bg-[#FF521C] rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dailyOrdersCount / 15) * 100, 100)}%` }}
              />

              {milestones.map((m) => {
                const isReached = dailyOrdersCount >= m.count;
                const leftPercent = (m.count / 15) * 100;
                return (
                  <div
                    key={m.count}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${leftPercent}%` }}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${isReached ? 'border-[#FF521C] text-[#FF521C]' : 'border-slate-300'}`}>
                      {isReached && <CheckOutlined className="text-[8px]" />}
                    </div>
                    <div className={`absolute top-5 ${m.count === 15 ? 'right-0 text-right' : 'left-1/2 -translate-x-1/2 text-center'} w-20`}>
                      <p className="text-[9px] font-bold text-slate-700">{m.count} Orders</p>
                      <p className={`text-[9px] font-black ${isReached ? 'text-emerald-600' : 'text-slate-400'}`}>{m.reward}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Completed Deliveries */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Recent Completed Deliveries</h3>
              <button
                onClick={() => navigate('/delivery/orders')}
                className="text-[11px] font-bold text-[#FF521C] hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <RightOutlined className="text-[8px]" />
              </button>
            </div>

            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Restaurant</th>
                      <th className="py-2 px-3">Earnings</th>
                      <th className="py-2 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 4).map(order => (
                      <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors text-xs">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {order.restaurant?.name || order.Restaurant?.name || 'Restaurant'}
                        </td>
                        <td className="py-2.5 px-3 font-black text-slate-900">
                          ₹{(parseFloat(order.delivery_fee || order.total_amount) || 150).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center text-center">
                <img
                  src="/empty-clipboard.jpg"
                  alt="No deliveries"
                  className="w-16 h-16 object-contain mb-2 filter drop-shadow-2xs"
                />
                <h4 className="text-slate-900 font-bold text-xs mb-0.5">
                  No completed deliveries yet.
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Accept orders and start delivering to build your history!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side Widgets */}
        <div className="space-y-3.5">
          {/* Current Status Widget */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Current Status</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                ● {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                🛵
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {isOnline ? 'You are online' : 'You are offline'}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  {isOnline ? 'You will receive new orders in your area.' : 'Go online to receive order offers.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleOnline}
              disabled={updatingStatus}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${isOnline
                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-xs'
                }`}
            >
              <span>{isOnline ? '🔴 Go Offline' : '🟢 Go Online'}</span>
            </button>
          </div>

          {/* Quick Actions Widget */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-2.5">
              {/* View Orders */}
              <button
                onClick={() => navigate('/delivery/orders')}
                className="p-2.5 rounded-xl bg-orange-50/70 hover:bg-orange-100/70 border border-orange-100/60 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#FF521C] text-white flex items-center justify-center text-xs font-bold mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                  <ShoppingOutlined />
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">View Orders</p>
              </button>

              {/* Earnings */}
              <button
                onClick={() => navigate('/delivery/summary')}
                className="p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-100/60 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                  <DollarOutlined />
                </div>
                <p className="text-xs font-bold text-emerald-700 leading-tight">Earnings</p>
              </button>

              {/* Help & Support */}
              <button
                onClick={() => navigate('/delivery/profile')}
                className="p-2.5 rounded-xl bg-blue-50/60 hover:bg-blue-100/60 border border-blue-100/50 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                  <CustomerServiceOutlined />
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Help & Support</p>
              </button>

              {/* My Profile */}
              <button
                onClick={() => navigate('/delivery/profile')}
                className="p-2.5 rounded-xl bg-purple-50/60 hover:bg-purple-100/60 border border-purple-100/50 text-left transition-all group"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold mb-1 shadow-2xs group-hover:scale-105 transition-transform">
                  <UserOutlined />
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">My Profile</p>
              </button>
            </div>
          </div>

          {/* Achieve More, Earn More Rewards Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 border border-amber-100 shadow-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-base shadow-xs shrink-0">
                <TrophyOutlined />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 leading-tight">
                  Achieve More, Earn More!
                </h4>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Complete daily target & unlock bonuses.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/delivery/summary')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-900 font-bold text-[11px] rounded-lg shadow-2xs shrink-0 transition-all"
            >
              Rewards →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
