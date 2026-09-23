import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { resetCartState } from '../../redux/slices/cartSlice';
import socket from '../../socket';
import BrandLogo from '../common/BrandLogo';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ShopOutlined,
  CarOutlined,
  UnorderedListOutlined,
  WalletOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  CrownOutlined,
  DownOutlined,
  RightOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector(state => state.auth);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState([
    { id: 1, title: 'New restaurant "Spice House" requested approval', time: '12 mins ago', read: false },
    { id: 2, title: 'Delivery partner "Rahul" submitted verification documents', time: '45 mins ago', read: false },
    { id: 3, title: 'System automated backup completed successfully', time: '2 hours ago', read: true }
  ]);

  const notificationRef = useRef(null);

  // Security guard: redirect if not admin
  if (!isAuthenticated || user?.role?.toLowerCase() !== 'admin') {
    return <Link to="/admin/login" replace />;
  }

  // Close notification popover on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Socket.io real-time admin notification listeners
  useEffect(() => {
    if (user?.id) {
      socket.connect();
      socket.emit('join', user.id);

      const handleNewOrder = (data) => {
        const notif = {
          id: Date.now(),
          title: `New Platform Order #${data.orderId ? data.orderId.slice(0, 8).toUpperCase() : 'ORD'} received!`,
          time: 'Just now',
          read: false
        };
        setNotificationsList(prev => [notif, ...prev]);
      };

      const handleNewPartner = (data) => {
        const notif = {
          id: Date.now(),
          title: `New ${data.type || 'Partner'} registration request pending approval`,
          time: 'Just now',
          read: false
        };
        setNotificationsList(prev => [notif, ...prev]);
      };

      socket.on('NEW_ORDER', handleNewOrder);
      socket.on('PARTNER_REGISTERED', handleNewPartner);

      return () => {
        socket.off('NEW_ORDER', handleNewOrder);
        socket.off('PARTNER_REGISTERED', handleNewPartner);
      };
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCartState());
    navigate('/admin/login');
  };

  const markAllRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotificationsList([]);
  };

  const unreadCount = notificationsList.filter(n => !n.read).length;
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: <AppstoreOutlined /> },
    { label: 'Orders', path: '/admin/orders', icon: <ShoppingOutlined /> },
    { label: 'Users', path: '/admin/users', icon: <TeamOutlined />, hasDropdown: true },
    { label: 'Restaurants', path: '/admin/pending-approvals', icon: <ShopOutlined />, hasDropdown: true },
    { label: 'Delivery Partners', path: '/admin/drivers', icon: <CarOutlined />, hasDropdown: true },
    { label: 'Menu Catalog', path: '/admin/menu', icon: <UnorderedListOutlined />, hasDropdown: true },
    { label: 'Payouts', path: '/admin/payouts', icon: <WalletOutlined />, hasDropdown: true },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChartOutlined /> },
    { label: 'System Settings', path: '/admin/settings', icon: <SettingOutlined />, hasDropdown: true }
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Fixed Left Sidebar */}
      <aside className="w-60 bg-[#0F172A] text-white fixed top-0 bottom-0 left-0 z-30 flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-to-tr from-orange-600/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="p-4 flex-1 flex flex-col overflow-y-auto">
          {/* Brand Header */}
          <div className="px-2 py-2 mb-4">
            <BrandLogo variant="orange" size="md" to="/admin" />
          </div>

          {/* Sidebar Nav Links */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive = item.path === '/admin' 
                ? currentPath === '/admin' 
                : currentPath.startsWith(item.path);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group relative ${
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

                  {item.hasDropdown && (
                    <DownOutlined className={`text-[9px] ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Upgrade Banner Box */}
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-orange-500/20 relative overflow-hidden group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mb-2 shadow-sm shadow-orange-500/20 text-white text-base">
              <CrownOutlined />
            </div>
            <h4 className="text-xs font-black text-white mb-0.5">
              Keep Orderly Growing Together
            </h4>
            <p className="text-[10px] text-slate-400 leading-tight mb-2.5">
              Manage. Track. Support. All in one place.
            </p>
            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full py-1.5 bg-[#FF521C] hover:bg-[#E04310] text-white font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 group/btn shadow-xs cursor-pointer"
            >
              <span>Upgrade Plan</span>
              <RightOutlined className="text-[9px] group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-60 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Clean Header Bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
          <div>
            <h1 className="text-base font-black text-slate-800 tracking-tight leading-none">
              Admin Dashboard
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              MANAGEMENT CONSOLE
            </p>
          </div>

          {/* Right Section: Real Notifications & Logout */}
          <div className="flex items-center gap-3">
            {/* Interactive Notification Bell Popover */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-8 h-8 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
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

              {/* Notification Popover */}
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
                        onClick={clearNotifications}
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
                          className={`p-2.5 rounded-xl border transition-colors flex items-start justify-between gap-2 ${
                            item.read ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-orange-50/40 border-orange-100/80 text-slate-800 font-semibold'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold leading-tight">{item.title}</p>
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
              className="flex items-center gap-1.5 bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
            >
              <LogoutOutlined className="text-xs" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="p-4 md:p-5 flex-1 overflow-y-auto min-h-0 bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
