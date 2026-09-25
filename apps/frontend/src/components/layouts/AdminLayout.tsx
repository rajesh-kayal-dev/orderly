import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { resetCartState } from '../../redux/slices/cartSlice';
import { notification } from 'antd';
import axios from '../../api/axios';
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
  RightOutlined,
  ClockCircleOutlined,
  StarOutlined
} from '@ant-design/icons';

interface AdminNotificationItem {
  id: string | number;
  title: string;
  link?: string;
  type?: string;
  time: string;
  read: boolean;
  message?: string;
}

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state: any) => state.auth);

  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notificationsList, setNotificationsList] = useState<AdminNotificationItem[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  const notificationRef = useRef<HTMLDivElement>(null);

  const fetchActiveOrdersCount = useCallback(async () => {
    try {
      const res = await axios.get('/admin/orders?limit=1');
      if (res.data?.success && res.data?.counts) {
        const c = res.data.counts;
        const totalActive = (c.pending || 0) + (c.accepted || 0) + (c.preparing || 0) + (c.ready || 0) + (c.picked_up || 0);
        setActiveOrdersCount(totalActive);
      }
    } catch {
      // silent
    }
  }, []);

  // Close notification popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Socket.io real-time admin notification listeners and live stats
  useEffect(() => {
    if (user?.id) {
      socket.connect();
      socket.emit('join', user.id);
      socket.emit('join_admin');
      socket.emit('join', 'role_admin');

      fetchActiveOrdersCount();

      // Fetch persistent admin notifications on mount
      axios.get('/notifications').then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const mapped = res.data.data.map((n: any) => ({
            id: n.id,
            title: n.title || n.message,
            link: n.link || (n.type === 'Driver' || n.role === 'delivery_partner' ? '/admin/drivers' : n.type === 'Restaurant' || n.role === 'restaurant' ? '/admin/restaurants' : n.type === 'Customer' || n.role === 'customer' ? '/admin/users' : '/admin'),
            type: n.type,
            time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            read: Boolean(n.read),
          }));
          setNotificationsList(mapped);
        }
      }).catch(() => {});

      const handleNewOrder = (data: any) => {
        fetchActiveOrdersCount();
        const notif: AdminNotificationItem = {
          id: Date.now(),
          title: `New Platform Order #${data?.orderId ? data.orderId.slice(0, 8).toUpperCase() : 'ORD'} received!`,
          link: '/admin/orders',
          type: 'Order',
          time: 'Just now',
          read: false
        };
        setNotificationsList(prev => [notif, ...prev]);
        notification.info({
          message: notif.title,
          description: `Customer placed order for ₹${data?.total || 0}`,
          placement: 'topRight',
          duration: 4.5,
        });
      };

      const handleOrderStatusUpdate = () => {
        fetchActiveOrdersCount();
      };

      const handleNewPartner = (data: any) => {
        const isDriver = data?.type === 'Driver' || data?.role === 'delivery_partner';
        const notif: AdminNotificationItem = {
          id: Date.now(),
          title: isDriver 
            ? `Delivery partner "${data?.name || ''}" submitted verification documents`
            : `New Restaurant "${data?.name || ''}" registered`,
          link: data?.link || (isDriver ? '/admin/drivers' : '/admin/restaurants'),
          type: data?.type || (isDriver ? 'Driver' : 'Restaurant'),
          time: 'Just now',
          read: false
        };
        setNotificationsList(prev => [notif, ...prev]);
        notification.info({
          message: notif.title,
          description: isDriver ? 'New driver pending approval.' : 'New restaurant pending approval.',
          placement: 'topRight',
          duration: 5,
        });
      };

      const handleNewUser = (data: any) => {
        const notif: AdminNotificationItem = {
          id: Date.now(),
          title: `New Customer "${data?.full_name || data?.fullName || data?.name || 'User'}" joined Orderly`,
          link: '/admin/users',
          type: 'Customer',
          time: 'Just now',
          read: false
        };
        setNotificationsList(prev => [notif, ...prev]);
        notification.info({
          message: notif.title,
          placement: 'topRight',
          duration: 4,
        });
      };

      const handleNewNotification = (notif: any) => {
        const t = (notif?.title || notif?.message || '').toLowerCase();
        let targetLink = notif?.link;
        if (!targetLink) {
          if (t.includes('delivery') || t.includes('driver') || notif?.type === 'Driver') targetLink = '/admin/drivers';
          else if (t.includes('restaurant') || notif?.type === 'Restaurant') targetLink = '/admin/restaurants';
          else if (t.includes('customer') || t.includes('user') || notif?.type === 'Customer') targetLink = '/admin/users';
          else if (t.includes('order') || notif?.type === 'Order') targetLink = '/admin/orders';
          else if (t.includes('feedback')) targetLink = '/admin/feedback';
          else targetLink = '/admin';
        }

        const newN: AdminNotificationItem = {
          id: notif?.id || Date.now(),
          title: notif?.title || notif?.message,
          link: targetLink,
          type: notif?.type,
          time: 'Just now',
          read: false
        };

        setNotificationsList(prev => [newN, ...prev]);
        notification.info({
          message: newN.title,
          description: notif?.message || 'New admin alert received.',
          placement: 'topRight',
          duration: 4.5,
        });
      };

      const handleNewFeedback = (fb: any) => {
        const notif: AdminNotificationItem = {
          id: Date.now(),
          title: `New Feedback received: "${fb?.sentiment}" from ${fb?.customer_name || 'Customer'}`,
          link: '/admin/feedback',
          type: 'Feedback',
          time: 'Just now',
          read: false
        };
        setNotificationsList(prev => [notif, ...prev]);
        notification.info({
          message: notif.title,
          placement: 'topRight',
          duration: 4,
        });
      };

      socket.on('NEW_ORDER', handleNewOrder);
      socket.on('ORDER_STATUS_UPDATED', handleOrderStatusUpdate);
      socket.on('ORDER_READY_FOR_PICKUP', handleOrderStatusUpdate);
      socket.on('DRIVER_ASSIGNED', handleOrderStatusUpdate);
      socket.on('PARTNER_REGISTERED', handleNewPartner);
      socket.on('NEW_RESTAURANT_REGISTERED', handleNewPartner);
      socket.on('NEW_DELIVERY_PARTNER_REGISTERED', handleNewPartner);
      socket.on('NEW_USER_REGISTERED', handleNewUser);
      socket.on('NEW_NOTIFICATION', handleNewNotification);
      socket.on('NEW_FEEDBACK', handleNewFeedback);

      return () => {
        socket.off('NEW_ORDER', handleNewOrder);
        socket.off('ORDER_STATUS_UPDATED', handleOrderStatusUpdate);
        socket.off('ORDER_READY_FOR_PICKUP', handleOrderStatusUpdate);
        socket.off('DRIVER_ASSIGNED', handleOrderStatusUpdate);
        socket.off('PARTNER_REGISTERED', handleNewPartner);
        socket.off('NEW_RESTAURANT_REGISTERED', handleNewPartner);
        socket.off('NEW_DELIVERY_PARTNER_REGISTERED', handleNewPartner);
        socket.off('NEW_USER_REGISTERED', handleNewUser);
        socket.off('NEW_NOTIFICATION', handleNewNotification);
        socket.off('NEW_FEEDBACK', handleNewFeedback);
      };
    }
  }, [user, fetchActiveOrdersCount]);

  // Security guard: redirect if not admin
  if (!isAuthenticated || user?.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCartState());
    navigate('/admin/login');
  };

  const markAllRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
    axios.post('/notifications/read-all').catch(() => {});
  };

  const clearNotifications = () => {
    setNotificationsList([]);
    axios.delete('/notifications').catch(() => {});
  };

  const handleNotificationClick = (item: AdminNotificationItem) => {
    setNotificationsList(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    if (item.id) {
      axios.patch(`/notifications/${item.id}/read`).catch(() => {});
    }
    setShowNotifications(false);
    const targetLink = item.link || (item.type === 'Driver' ? '/admin/drivers' : item.type === 'Restaurant' ? '/admin/restaurants' : item.type === 'Customer' ? '/admin/users' : '/admin');
    navigate(targetLink);
  };

  const unreadCount = notificationsList.filter(n => !n.read).length;
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: <AppstoreOutlined /> },
    { label: 'Orders', path: '/admin/orders', icon: <ShoppingOutlined />, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { label: 'Users', path: '/admin/users', icon: <TeamOutlined /> },
    { label: 'Restaurants', path: '/admin/restaurants', icon: <ShopOutlined /> },
    { label: 'Delivery Partners', path: '/admin/drivers', icon: <CarOutlined /> },
    { label: 'Feedback', path: '/admin/feedback', icon: <StarOutlined /> },
    { label: 'Menu Catalog', path: '/admin/menu', icon: <UnorderedListOutlined /> },
    { label: 'Payouts', path: '/admin/payouts', icon: <WalletOutlined /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChartOutlined /> },
    { label: 'System Settings', path: '/admin/settings', icon: <SettingOutlined /> }
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
                className={`relative w-9 h-9 rounded-xl border transition-colors flex items-center justify-center cursor-pointer ${
                  showNotifications
                    ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                }`}
                title="Notifications"
              >
                <BellOutlined className="text-base" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3.5 px-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">Platform Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={markAllRead}
                        className="text-[11px] font-bold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        Mark all read
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        onClick={clearNotifications}
                        className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 text-xs pr-1">
                    {notificationsList.length > 0 ? (
                      notificationsList.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 hover:shadow-xs ${
                            item.read 
                              ? 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-100/70 hover:border-slate-200' 
                              : 'bg-orange-50/50 border-orange-200/80 text-slate-900 font-semibold hover:bg-orange-100/60 hover:border-orange-300'
                          }`}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {item.type && (
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                  item.type === 'Order' ? 'bg-orange-100 text-orange-700' :
                                  item.type === 'Driver' ? 'bg-blue-100 text-blue-700' :
                                  item.type === 'Restaurant' ? 'bg-emerald-100 text-emerald-700' :
                                  item.type === 'Feedback' ? 'bg-purple-100 text-purple-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {item.type}
                                </span>
                              )}
                              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <ClockCircleOutlined className="text-[9px]" /> {item.time}
                              </p>
                            </div>
                            <p className="text-xs font-bold leading-snug break-words">{item.title}</p>
                          </div>
                          {!item.read && (
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 mt-1 shadow-xs" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs font-medium">
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
