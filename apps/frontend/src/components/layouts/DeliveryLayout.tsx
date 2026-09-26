import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { resetCartState } from '../../redux/slices/cartSlice';
import { loginSuccess } from '../../redux/slices/authSlice';
import { notification } from 'antd';
import axios from '../../api/axios';
import socket from '../../socket';
import BrandLogo from '../common/BrandLogo';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  WalletOutlined,
  BarChartOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  CalendarOutlined,
  RightOutlined,
  ClockCircleOutlined,
  CarOutlined,
  DownOutlined
} from '@ant-design/icons';

interface NotificationItem {
  id: string | number;
  title: string;
  message?: string;
  time: string;
  read: boolean;
  link?: string;
  orderId?: string;
}

export default function DeliveryLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, token } = useSelector((state: any) => state.auth);

  // Track online status from redux profile in real time
  const isOnline = Boolean(profile?.is_available);

  const [currentDateString, setCurrentDateString] = useState<string>('10-09-2026');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [deliveryActiveCount, setDeliveryActiveCount] = useState<number>(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  const fetchDeliveryActiveCount = useCallback(async () => {
    if (!token) return;
    try {
      const [availRes, myRes] = await Promise.allSettled([
        axios.get('/orders/deliveries/available'),
        axios.get('/orders/driver/me')
      ]);

      let availCount = 0;
      let activeMyCount = 0;

      if (availRes.status === 'fulfilled' && availRes.value.data?.success) {
        availCount = (availRes.value.data.data || []).length;
      }
      if (myRes.status === 'fulfilled' && myRes.value.data?.success) {
        const myOrders = myRes.value.data.data || [];
        activeMyCount = myOrders.filter((o: any) => !['delivered', 'completed', 'cancelled'].includes(o.status)).length;
      }

      setDeliveryActiveCount(isOnline ? availCount + activeMyCount : activeMyCount);
    } catch {
      // silent
    }
  }, [token, isOnline]);

  useEffect(() => {
    const d = new Date();
    setCurrentDateString(d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'));
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

  // Socket notification listener & live count sync
  useEffect(() => {
    if (!user?.id) return;

    socket.connect();
    socket.emit('join', user.id);
    socket.emit('join_deliveries');
    socket.emit('join', 'role_delivery');

    fetchDeliveryActiveCount();

    // Fetch persistent delivery notifications on mount
    axios.get('/notifications').then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        const mapped = res.data.data.map((n: any) => ({
          id: n.id,
          title: n.title || n.message,
          message: n.message,
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
          read: Boolean(n.read),
          link: n.link || '/delivery',
          orderId: n.orderId,
        }));
        setNotificationsList(mapped);
      }
    }).catch(() => {});

    const handleNewNotification = (data: any) => {
      if (!data) return;
      const notif: NotificationItem = {
        id: data.id || Date.now(),
        title: data.title || data.message || 'Notification',
        message: data.message,
        time: data.createdAt ? new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        read: Boolean(data.read),
        link: data.link || '/delivery',
        orderId: data.orderId,
      };
      setNotificationsList((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      notification.info({
        title: notif.title,
        description: notif.message || 'You have a new update.',
        placement: 'topRight',
        duration: 4.5,
      });
    };

    const handlePartnerApproved = () => {
      const notif: NotificationItem = {
        id: `approved-${Date.now()}`,
        title: 'Account & Vehicle Approved! 🎉',
        message: 'Congratulations! Your delivery partner account has been verified and approved. You can now go online and accept orders.',
        time: 'Just now',
        read: false,
        link: '/delivery',
      };
      setNotificationsList((prev) => [notif, ...prev.filter((n) => n.title !== notif.title)]);
      dispatch(loginSuccess({
        user: { ...user, status: 'ACTIVE', is_approved: true, is_active: true },
        profile: { ...profile, status: 'ACTIVE', is_approved: true, is_active: true },
        token
      }));
      notification.success({
        title: 'Account Approved! 🎉',
        description: 'Your delivery partner account has been verified and approved by admin!',
        placement: 'topRight',
        duration: 6,
      });
    };

    const handleDeliveryOffer = (data: any) => {
      fetchDeliveryActiveCount();
      if (!isOnline) return;
      const orderNum = data?.orderId ? data.orderId.slice(0, 8).toUpperCase() : 'ORD';
      const notif: NotificationItem = {
        id: Date.now(),
        title: `New Delivery Available! #${orderNum}`,
        message: `Pickup available for Order #${orderNum}`,
        time: 'Just now',
        read: false,
        link: '/delivery/orders',
        orderId: data?.orderId
      };
      setNotificationsList(prev => [notif, ...prev]);
      notification.info({
        title: `New Delivery Request #${orderNum}`,
        description: 'A new order is available for pickup. Open Orders to accept.',
        placement: 'topRight',
        duration: 5,
      });
    };

    const handleReadyForPickup = (data: any) => {
      fetchDeliveryActiveCount();
      if (!isOnline) return;
      const orderNum = data?.orderId ? data.orderId.slice(0, 8).toUpperCase() : 'ORD';
      const notif: NotificationItem = {
        id: Date.now(),
        title: `Order #${orderNum} Ready for Pickup!`,
        message: `Order #${orderNum} is ready for pickup from restaurant.`,
        time: 'Just now',
        read: false,
        link: '/delivery/orders',
        orderId: data?.orderId
      };
      setNotificationsList(prev => [notif, ...prev]);
      notification.info({
        title: `Order #${orderNum} Ready!`,
        description: 'Restaurant has marked this order ready for pickup.',
        placement: 'topRight',
        duration: 4.5,
      });
    };

    const handleDriverAssigned = (data: any) => {
      fetchDeliveryActiveCount();
      const orderNum = data?.orderId ? data.orderId.slice(0, 8).toUpperCase() : 'ORD';
      const notif: NotificationItem = {
        id: Date.now(),
        title: `Order #${orderNum} assigned to you!`,
        message: `You are assigned to deliver Order #${orderNum}.`,
        time: 'Just now',
        read: false,
        link: '/delivery/orders',
        orderId: data?.orderId
      };
      setNotificationsList(prev => [notif, ...prev]);
      notification.success({
        title: `Order #${orderNum} Assigned`,
        description: 'You have been assigned to deliver this order.',
        placement: 'topRight',
        duration: 5,
      });
    };

    const handleOrderAccepted = (data: any) => {
      fetchDeliveryActiveCount();
      setNotificationsList(prev => prev.filter(n => n.orderId !== data?.orderId));
    };

    const handleOrderStatusUpdate = () => {
      fetchDeliveryActiveCount();
    };

    socket.on('NEW_NOTIFICATION', handleNewNotification);
    socket.on('PARTNER_APPROVED', handlePartnerApproved);
    socket.on('AVAILABLE_DELIVERY', handleDeliveryOffer);
    socket.on('ORDER_READY_FOR_PICKUP', handleReadyForPickup);
    socket.on('DRIVER_ASSIGNED', handleDriverAssigned);
    socket.on('ORDER_ACCEPTED', handleOrderAccepted);
    socket.on('ORDER_STATUS_UPDATED', handleOrderStatusUpdate);

    return () => {
      socket.off('NEW_NOTIFICATION', handleNewNotification);
      socket.off('PARTNER_APPROVED', handlePartnerApproved);
      socket.off('AVAILABLE_DELIVERY', handleDeliveryOffer);
      socket.off('ORDER_READY_FOR_PICKUP', handleReadyForPickup);
      socket.off('DRIVER_ASSIGNED', handleDriverAssigned);
      socket.off('ORDER_ACCEPTED', handleOrderAccepted);
      socket.off('ORDER_STATUS_UPDATED', handleOrderStatusUpdate);
    };
  }, [user, isOnline, profile, token, fetchDeliveryActiveCount, dispatch]);

  if (!token || user?.role !== 'delivery_partner') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCartState());
    navigate('/login');
  };

  const markAllRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, read: true })));
    axios.post('/notifications/read-all').catch(() => {});
  };

  const clearNotifications = () => {
    setNotificationsList([]);
    axios.delete('/notifications').catch(() => {});
  };

  const unreadCount = notificationsList.filter(n => !n.read).length;
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Dashboard', path: '/delivery', icon: <AppstoreOutlined /> },
    { label: 'Orders', path: '/delivery/orders', icon: <ShoppingOutlined />, badge: deliveryActiveCount > 0 ? deliveryActiveCount : undefined },
    { label: 'Earnings', path: '/delivery/summary', icon: <WalletOutlined /> },
    { label: 'Monthly Summary', path: '/delivery/summary', icon: <BarChartOutlined /> },
    { label: 'Profile', path: '/delivery/profile', icon: <UserOutlined /> },
    { label: 'Settings', path: '/delivery/settings', icon: <SettingOutlined /> }
  ];

  const getPageTitle = () => {
    if (currentPath === '/delivery/orders') return 'Available Deliveries';
    if (currentPath === '/delivery/summary') return 'Earnings & Summary';
    if (currentPath === '/delivery/profile') return 'My Driver Profile';
    if (currentPath === '/delivery/settings') return 'Driver Settings';
    return 'Delivery Partner Dashboard';
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Fixed Left Sidebar */}
      <aside className="w-60 bg-[#0F172A] text-white fixed top-0 bottom-0 left-0 z-30 flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-gradient-to-tr from-orange-600/20 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="p-4 flex-1 flex flex-col overflow-y-auto">
          {/* Logo Header */}
          <div className="px-2 py-2 mb-4">
            <BrandLogo variant="orange" size="md" to="/delivery" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/delivery'
                  ? currentPath === '/delivery'
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

                  {item.badge !== undefined && item.badge > 0 && (
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

          {/* Referral & Promo Card */}
          <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-orange-500/20 relative overflow-hidden group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center mb-2 shadow-sm shadow-orange-500/20 text-white text-base">
              <CarOutlined />
            </div>
            <h4 className="text-xs font-black text-white mb-0.5">
              Ride More Earn More!
            </h4>
            <p className="text-[10px] text-slate-400 leading-tight mb-2.5">
              Complete more deliveries and get higher rewards.
            </p>
            <button
              onClick={() => navigate('/delivery/summary')}
              className="w-full py-1.5 bg-[#FF521C] hover:bg-[#E04310] text-white font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 group/btn shadow-xs"
            >
              <span>View Offers</span>
              <RightOutlined className="text-[9px] group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 ml-60 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Clean Header Bar */}
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
            {/* Date Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
              <CalendarOutlined className="text-slate-400 text-xs" />
              <span>{currentDateString}</span>
              <DownOutlined className="text-[8px] text-slate-400 ml-0.5" />
            </div>

            {/* Online/Offline Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                isOnline
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
              {isOnline ? 'Online' : 'Offline'}
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
                          onClick={() => {
                            setNotificationsList(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
                            if (item.id) axios.patch(`/notifications/${item.id}/read`).catch(() => {});
                            setShowNotifications(false);
                            navigate(item.link || '/delivery/orders');
                          }}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 hover:border-orange-300 hover:shadow-xs group ${
                            item.read ? 'bg-slate-50/50 border-slate-100 text-slate-500' : 'bg-orange-50/40 border-orange-100/80 text-slate-800 font-semibold'
                          }`}
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold leading-tight group-hover:text-orange-600 transition-colors truncate">{item.title}</p>
                              <span className="text-[9px] text-orange-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">View ➔</span>
                            </div>
                            {item.message && item.message !== item.title && (
                              <p className="text-[10.5px] text-slate-500 font-normal leading-tight line-clamp-2 mt-0.5">
                                {item.message}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
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

        {/* Dynamic Page Content Scroll Area */}
        <main className="p-4 md:p-5 flex-1 overflow-y-auto min-h-0 bg-[#F8FAFC]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
