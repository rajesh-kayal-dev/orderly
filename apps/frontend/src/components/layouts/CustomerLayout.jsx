import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import socket from '../../socket';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

export default function CustomerLayout() {
  const location = useLocation();
  const { token } = useSelector((state) => state.auth);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);

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
            (order) => order.status !== 'completed' && order.status !== 'cancelled'
          );
          setActiveOrdersCount(activeOrders.length);
        }
      } catch (error) {
        console.error('Failed to fetch active orders count:', error);
      }
    };

    fetchActiveOrdersCount();

    const handleOrderUpdated = () => {
      fetchActiveOrdersCount();
    };

    socket.on('ORDER_STATUS_UPDATED', handleOrderUpdated);

    return () => {
      socket.off('ORDER_STATUS_UPDATED', handleOrderUpdated);
    };
  }, [token, location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-orange-100 selection:text-orange-900">
      <Navbar activeOrdersCount={activeOrdersCount} />

      <main className="flex-grow pt-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
