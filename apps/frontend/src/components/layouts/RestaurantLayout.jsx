import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, loginSuccess } from '../../redux/slices/authSlice';
import { resetCartState } from '../../redux/slices/cartSlice';
import axios from '../../api/axios';
import socket from '../../socket';
import { notification } from 'antd';
import BrandLogo from '../common/BrandLogo';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  StarOutlined,
  WalletOutlined,
  SettingOutlined,
  BellOutlined,
  CalendarOutlined,
  LogoutOutlined,
  RightOutlined,
  CrownOutlined,
  DownOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

export default function RestaurantLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, token } = useSelector(state => state.auth);
  const activeCount = useSelector(state => state.order.activeCount);

  const [isRestaurantOpen, setIsRestaurantOpen] = useState(Boolean(profile?.is_active ?? profile?.is_open ?? true));
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Notification Popover State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    { id: 1, title: 'New Order #ORD-8821', time: '5 mins ago', read: false, link: '/restaurant/orders' },
    { id: 2, title: 'Table #4 requested bill', time: '18 mins ago', read: false, link: '/restaurant/orders' },
    { id: 3, title: 'Weekly payout ₹12,450 credited', time: '1 hour ago', read: true, link: '/restaurant/payouts' }
  ]);
  const notificationRef = useRef(null);

  // Dynamic Date Display
  const [currentDateString, setCurrentDateString] = useState('');

  useEffect(() => {
    const d = new Date();
    setCurrentDateString(d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'));
  }, []);

  // Sync restaurant profile status on mount
  useEffect(() => {
    const fetchMyRestaurantStatus = async () => {
      if (!token) return;
      try {
        const response = await axios.get('/restaurants/my-profile');
        if (response.data?.success && response.data?.data) {
          const fetchedProf = response.data.data;
          const isOpen = Boolean(fetchedProf.is_active ?? fetchedProf.is_open ?? true);
          setIsRestaurantOpen(isOpen);
          dispatch(loginSuccess({
            user,
            profile: { ...profile, ...fetchedProf, is_open: isOpen, is_active: isOpen },
            token
          }));
        }
      } catch (err) {
        console.error('Error fetching restaurant profile status:', err);
      }
    };

    fetchMyRestaurantStatus();
  }, [token]);

  useEffect(() => {
    setIsRestaurantOpen(Boolean(profile?.is_active ?? profile?.is_open ?? true));
  }, [profile?.is_active, profile?.is_open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.id) {
      socket.connect();
      socket.emit('join', user.id);
      if (profile?.id) socket.emit('join', profile.id);

      const handleNewOrder = (data) => {
        const orderNum = data.orderId ? data.orderId.slice(0, 8).toUpperCase() : 'REC';
        const newNotif = {
          id: Date.now(),
          title: `New Order #${orderNum} received!`,
          time: 'Just now',
          read: false,
          link: '/restaurant/orders'
        };
        setNotificationsList(prev => [newNotif, ...prev]);
      };

      const handleStatusUpdate = (data) => {
        const orderNum = data.orderId ? data.orderId.slice(0, 8).toUpperCase() : '';
        const newNotif = {
          id: Date.now(),
          title: `Order #${orderNum} updated to ${data.status ? data.status.replace(/_/g, ' ') : 'new status'}`,
          time: 'Just now',
          read: false,
          link: '/restaurant/orders'
        };
        setNotificationsList(prev => [newNotif, ...prev]);
      };

      socket.on('NEW_ORDER', handleNewOrder);
      socket.on('ORDER_STATUS_UPDATED', handleStatusUpdate);
      return () => {
        socket.off('NEW_ORDER', handleNewOrder);
        socket.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
      };
    }
  }, [user, profile]);

  const handleStatusChange = async (newStatus) => {
    if (updatingStatus) return;
    try {
      setUpdatingStatus(true);
      const response = await axios.put('/restaurants/my-profile', {
        is_active: newStatus,
        is_open: newStatus
      });
      if (response.data?.success) {
        const updatedProfile = response.data.data;
        const isOpen = Boolean(updatedProfile?.is_active ?? updatedProfile?.is_open ?? newStatus);
        
        setIsRestaurantOpen(isOpen);
        dispatch(loginSuccess({
          user,
          profile: { ...profile, ...updatedProfile, is_open: isOpen, is_active: isOpen },
          token
        }));

        // Broadcast status update via socket so customer pages update in real-time
        if (socket) {
          socket.emit('RESTAURANT_STATUS_UPDATED', {
            restaurantId: updatedProfile.id || profile?.id,
            is_open: isOpen,
            is_active: isOpen,
            name: updatedProfile.name || profile?.name || 'Restaurant'
          });
        }

        notification.success({
          title: 'Restaurant Status Updated',
          description: newStatus ? 'Your restaurant is now OPEN for orders.' : 'Your restaurant is now CLOSED for orders.',
          placement: 'topRight'
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      notification.error({
        title: 'Status Update Failed',
        description: error.response?.data?.message || 'Failed to update restaurant status.',
        placement: 'topRight'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCartState());
    navigate('/login');
  };

  const markAllRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotificationsList([]);
  };

  const unreadCount = notificationsList.filter(n => !n.read).length;
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/restaurant', icon: <AppstoreOutlined /> },
    { label: 'Orders', path: '/restaurant/orders', icon: <ShoppingOutlined />, badge: activeCount },
    { label: 'Menu Catalog', path: '/restaurant/menu', icon: <UnorderedListOutlined /> },
    { label: 'Analytics', path: '/restaurant/summary', icon: <BarChartOutlined /> },
    { label: 'Reviews', path: '/restaurant/reviews', icon: <StarOutlined /> },
    { label: 'Payouts', path: '/restaurant/payouts', icon: <WalletOutlined /> },
    { label: 'Settings', path: '/restaurant/settings', icon: <SettingOutlined /> }
  ];

  const getPageTitle = () => {
    if (currentPath === '/restaurant/orders') return 'Kitchen Orders';
    if (currentPath === '/restaurant/menu') return 'Menu Catalog';
    if (currentPath === '/restaurant/summary') return 'Analytics & Reports';
    if (currentPath === '/restaurant/reviews') return 'Customer Reviews';
    if (currentPath === '/restaurant/payouts') return 'Payouts & Earnings';
    if (currentPath === '/restaurant/settings') return 'Restaurant Settings';
    return 'Restaurant Dashboard';
  };

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Rajesh Kayal';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Fixed Left Sidebar */}
      <aside className="w-60 bg-[#0F172A] text-white fixed top-0 bottom-0 left-0 z-30 flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-to-tr from-orange-600/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="p-4 flex-1 flex flex-col overflow-y-auto">
          {/* Logo Header */}
          <div className="px-2 py-2 mb-3">
            <BrandLogo variant="orange" size="md" to="/restaurant" />
          </div>

          {/* User Account Card */}
          <Link
            to="/restaurant/settings"
            className="flex items-center justify-between p-2.5 mb-4 rounded-xl bg-[#1E293B]/80 hover:bg-[#1E293B] border border-white/5 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white border border-white/10 shrink-0">
                {userInitial}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-100 truncate group-hover:text-orange-400 transition-colors">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 truncate font-medium">
                  Restaurant Account
                </p>
              </div>
            </div>
            <RightOutlined className="text-[10px] text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/restaurant'
                  ? currentPath === '/restaurant'
                  : currentPath.startsWith(item.path);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF521C] to-[#FF6B00] text-white shadow-md shadow-orange-500/25 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-base ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-black rounded-full ${
                        isActive
                          ? 'bg-white text-orange-600'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Upgrade to Pro Card */}
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-orange-500/20 relative overflow-hidden group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mb-2 shadow-sm shadow-orange-500/20">
              <CrownOutlined className="text-white text-xs" />
            </div>
            <h4 className="text-xs font-bold text-white mb-0.5">Upgrade to Pro</h4>
            <p className="text-[10px] text-slate-400 leading-tight mb-2">
              Get more orders, analytics & premium support.
            </p>
            <button
              onClick={() => navigate('/restaurant/settings')}
              className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 group/btn"
            >
              <span>Upgrade Now</span>
              <RightOutlined className="text-[9px] group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 ml-60 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
          <div>
            <h1 className="text-base font-black text-slate-800 tracking-tight leading-none">
              {getPageTitle()}
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              MANAGEMENT CONSOLE
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Store Status Dropdown */}
            <div className="relative inline-flex items-center">
              <select
                value={isRestaurantOpen ? 'open' : 'closed'}
                onChange={(e) => handleStatusChange(e.target.value === 'open')}
                disabled={updatingStatus}
                className={`appearance-none pl-3 pr-7 py-1 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-2xs transition-all focus:outline-none ${
                  isRestaurantOpen
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <option value="open" className="bg-white text-slate-800 font-bold">
                  ● OPEN
                </option>
                <option value="closed" className="bg-white text-slate-800 font-bold">
                  ● CLOSED
                </option>
              </select>
              <DownOutlined className={`absolute right-2 text-[8px] pointer-events-none ${isRestaurantOpen ? 'text-emerald-600' : 'text-rose-600'}`} />
            </div>

            {/* Date Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
              <CalendarOutlined className="text-slate-400 text-xs" />
              <span>{currentDateString || '11-09-2026'}</span>
              <span className="text-[9px] text-slate-400 ml-0.5">▼</span>
            </div>

            {/* Interactive Notification Bell Popover */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-8 h-8 rounded-lg border transition-colors flex items-center justify-center ${
                  showNotifications
                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                }`}
                title="Notifications"
              >
                <BellOutlined className="text-sm" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Floating Notifications Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 px-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllRead}
                        className="text-[10px] font-bold text-slate-500 hover:text-orange-600 transition-colors"
                      >
                        Mark read
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] font-bold text-rose-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
                    {notificationsList.length > 0 ? (
                      notificationsList.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setNotificationsList(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                            setShowNotifications(false);
                            navigate(item.link || '/restaurant/orders');
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 hover:border-orange-300 hover:shadow-xs group ${
                            item.read ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-orange-50/40 border-orange-100/80 text-slate-800 font-semibold'
                          }`}
                        >
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold leading-tight group-hover:text-orange-600 transition-colors">{item.title}</p>
                              <span className="text-[9px] text-orange-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-1">View ➔</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <ClockCircleOutlined className="text-[9px]" /> {item.time}
                            </p>
                          </div>
                          {!item.read && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs font-medium">
                        No notifications right now
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-all shadow-xs"
            >
              <LogoutOutlined className="text-xs" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="p-4 md:p-5 flex-1 overflow-y-auto min-h-0 bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
