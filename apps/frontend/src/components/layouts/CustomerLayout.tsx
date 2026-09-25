import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { notification } from 'antd';
import axios from '../../api/axios';
import socket from '../../socket';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

interface CustomerLayoutProps {
  children?: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps = {}) {
  const location = useLocation();
  const { token, user } = useSelector((state: any) => state.auth);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  useEffect(() => {
    const fetchActiveOrdersCount = async () => {
      if (!token) {
        setActiveOrdersCount(0);
        return;
      }

      try {
        const response = await axios.get('/orders/me');
        if (response.data.success) {
          const activeOrders = (response.data.data || []).filter(
            (order: any) => order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'cancelled'
          );
          setActiveOrdersCount(activeOrders.length);
        }
      } catch (error) {
        console.error('Failed to fetch active orders count:', error);
      }
    };

    fetchActiveOrdersCount();

    if (user?.id) {
      socket.connect();
      socket.emit('join', user.id);
      socket.emit('join', `user_${user.id}`);
      socket.emit('join', 'role_customer');
    }

    const handleOrderUpdated = (data: any) => {
      fetchActiveOrdersCount();
      if (data && data.status) {
        const orderNum = data.orderId ? data.orderId.slice(0, 8).toUpperCase() : 'your order';
        const formattedStatus = String(data.status).replace(/_/g, ' ').toUpperCase();
        notification.info({
          message: `Order #${orderNum} Update`,
          description: `Your order status is now: ${formattedStatus}`,
          placement: 'topRight',
          duration: 5,
        });
      }
    };

    const handleNewNotification = (data: any) => {
      if (!data) return;
      notification.info({
        message: data.title || 'Orderly Update',
        description: data.message || '',
        placement: 'topRight',
        duration: 4.5,
      });
    };

    socket.on('ORDER_STATUS_UPDATED', handleOrderUpdated);
    socket.on('DRIVER_ASSIGNED', handleOrderUpdated);
    socket.on('NEW_NOTIFICATION', handleNewNotification);

    return () => {
      socket.off('ORDER_STATUS_UPDATED', handleOrderUpdated);
      socket.off('DRIVER_ASSIGNED', handleOrderUpdated);
      socket.off('NEW_NOTIFICATION', handleNewNotification);
    };
  }, [token, user?.id, location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-orange-100 selection:text-orange-900">
      <Navbar activeOrdersCount={activeOrdersCount} />

      <main className="flex-grow pt-16">
        {children || <Outlet />}
      </main>

      <Footer />
    </div>
  );
}
