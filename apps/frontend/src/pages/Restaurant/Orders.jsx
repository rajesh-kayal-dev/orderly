import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import { notification } from 'antd';
import {
  CheckCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CarOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import socket from '../../socket';

const getTodayDateString = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
};

export default function RestaurantOrders() {
  const { profile, user } = useSelector(state => state.auth);

  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    accepted: 0,
    preparing: 0,
    picked_up: 0,
    delivered: 0,
    cancelled: 0
  });

  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(true);

  const fetchOrders = async (status = selectedStatus, date = selectedDate) => {
    try {
      setLoading(true);

      const { data } = await axios.get('/orders/restaurant/me', {
        params: { status, date }
      });

      if (data.success) {
        const filteredOrders = (data.data || []).filter(order => order.status !== 'refunded');
        setOrders(filteredOrders);

        if (data.counts) {
          setCounts(prev => ({
            ...prev,
            pending: data.counts.pending || 0,
            accepted: data.counts.accepted || 0,
            preparing: data.counts.preparing || 0,
            ready: data.counts.ready || 0,
            picked_up: data.counts.picked_up || 0,
            delivered: data.counts.delivered || 0,
            cancelled: data.counts.cancelled || 0
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchOrders();

      const handleNewOrder = (data) => {
        notification.success({
          message: 'New Order Received!',
          description: `Order #${data.orderId.slice(0, 8)} has been placed.`,
        });
        fetchOrders();
      };

      const handleStatusUpdate = () => {
        fetchOrders();
      };

      socket.on('NEW_ORDER', handleNewOrder);
      socket.on('ORDER_STATUS_UPDATED', handleStatusUpdate);

      return () => {
        socket.off('NEW_ORDER', handleNewOrder);
        socket.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
      };
    }
  }, [profile, user, selectedStatus]);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    fetchOrders(status, selectedDate);
  };

  const handleDateChange = (event) => {
    const nextDate = event.target.value;
    setSelectedDate(nextDate);
    fetchOrders(selectedStatus, nextDate);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const { data } = await axios.put(`/orders/${orderId}/status`, {
        status: newStatus
      });

      if (data.success) {
        notification.success({
          message: `Order marked as ${newStatus}`
        });
        fetchOrders();
      }
    } catch (error) {
      notification.error({
        message: 'Error updating order status'
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase">
            <ClockCircleOutlined className="mr-1" /> Pending
          </span>
        );

      case 'accepted':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">
            <CheckCircleOutlined className="mr-1" /> Accepted
          </span>
        );

      case 'preparing':
        return (
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase">
            <SyncOutlined spin className="mr-1" /> Preparing
          </span>
        );

      case 'picked_up':
        return (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase">
            <CarOutlined className="mr-1" /> On the Way
          </span>
        );

      case 'delivered':
      case 'completed':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
            <CheckCircleOutlined className="mr-1" /> Delivered
          </span>
        );

      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">
            <CloseCircleOutlined className="mr-1" /> Cancelled
          </span>
        );

      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">
            {status}
          </span>
        );
    }
  };

  const tabs = [
    { key: 'pending', label: 'Pending', icon: <ClockCircleOutlined /> },
    { key: 'accepted', label: 'Accepted', icon: <CheckCircleOutlined /> },
    { key: 'preparing', label: 'Preparing', icon: <SyncOutlined /> },
    { key: 'ready', label: 'Ready', icon: <CheckCircleOutlined /> },
    { key: 'picked_up', label: 'On the way', icon: <CarOutlined /> },
    { key: 'delivered', label: 'Completed', icon: <CheckCircleOutlined /> },
    { key: 'cancelled', label: 'Cancelled', icon: <CloseCircleOutlined /> },
  ];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="h-[38px] px-3 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            onClick={() => fetchOrders()}
            className="btn-secondary px-4 py-2 text-sm"
          >
            <SyncOutlined /> Refresh
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-t-2xl px-2 pt-2 flex-nowrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleStatusChange(tab.key)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${
              selectedStatus === tab.key
                ? 'text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                selectedStatus === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {counts[tab.key] || 0}
            </span>

            {selectedStatus === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(255,107,0,0.4)]"></div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-2xl shadow-soft overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-20 text-center text-gray-400 flex flex-col items-center">
            <SyncOutlined spin className="text-4xl mb-4 text-primary opacity-20" />
            <p className="font-medium">Loading {selectedStatus} orders...</p>
          </div>
        ) : orders.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-500 text-sm uppercase tracking-wide">
                <th className="p-4 font-semibold text-center w-20">#</th>
                <th className="p-4 font-semibold">Order Details</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Delivery</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map(order => {
                const orderItems = order.items || order.OrderItems || [];
                const itemCount = orderItems.length;
                const itemSummary = orderItems.map(item => {
                  const qty = item.quantity || 1;
                  const name = item.menuItem?.name || item.MenuItem?.name || item.name || 'Food Item';
                  return `${qty}x ${name}`;
                }).join(', ') || 'Food Items';

                const customerName = order.customer?.user?.full_name || 
                                     order.Customer?.User?.full_name || 
                                     order.customer_name || 
                                     'Customer';

                const rawPhone = order.customer?.user?.phone_number || 
                                 order.Customer?.User?.phone_number || 
                                 order.customer_phone ||
                                 order.phone_number;
                const customerPhone = (rawPhone && rawPhone.trim() && rawPhone !== 'N/A') ? rawPhone : 'Phone Not Provided';

                const addressObj = order.deliveryAddress || order.Address || order.delivery_address;
                const addressText = typeof addressObj === 'string'
                  ? addressObj
                  : (addressObj 
                      ? [addressObj.address_line1, addressObj.city, addressObj.state, addressObj.postal_code].filter(Boolean).join(', ') 
                      : 'Delivery Address Specified at Checkout');

                const driverName = order.deliveryPartner?.user?.full_name || 
                                   order.DeliveryPartner?.User?.full_name || 
                                   'Unassigned';

                const driverPhone = order.deliveryPartner?.user?.phone_number || 
                                    order.DeliveryPartner?.User?.phone_number || 
                                    'No Driver Assigned';

                const numAmount = Number(order.total ?? order.total_amount ?? order.subtotal ?? 0);
                const displayAmount = (numAmount > 0 ? numAmount : 0).toFixed(2);

                return (
                  <tr
                    key={order.id}
                    className="border-b hover:bg-neutral-50/70 transition-colors group"
                  >
                    <td className="p-4 font-medium text-neutral-800 text-center align-top">
                      <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>

                    <td className="p-4 align-top">
                      <div className="text-sm font-bold text-neutral-900 leading-snug">
                        {itemSummary}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide">
                          {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                        </span>
                        {order.notes && (
                          <span className="text-[11px] text-neutral-400 italic truncate max-w-[180px]" title={order.notes}>
                            "{order.notes}"
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <div className="font-bold text-neutral-900 text-sm">
                        {customerName}
                      </div>
                      <div className="text-xs text-neutral-500 font-medium mt-0.5 flex items-center gap-1">
                        <span>📞</span> {customerPhone}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 max-w-[200px] truncate leading-tight flex items-center gap-1" title={addressText}>
                        <span>📍</span> {addressText}
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <div className="font-bold text-neutral-900 text-sm">
                        {driverName}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        {driverPhone}
                      </div>
                    </td>

                    <td className="p-4 align-top">
                      <div className="font-black text-neutral-900 text-base">
                        ₹{displayAmount}
                      </div>
                      <div className="inline-block bg-neutral-100 text-neutral-500 text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase mt-0.5">
                        {order.payment_method || 'ONLINE'}
                      </div>
                    </td>

                    <td className="p-4 align-top">{getStatusBadge(order.status)}</td>

                  <td className="p-4 text-right align-top">
                    <div className="flex items-center gap-2 justify-end">
                      {(order.status === 'pending' || order.status === 'placed') && (
                        <>
                          <button
                            onClick={() => updateStatus(order.id, 'cancelled')}
                            className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => updateStatus(order.id, 'accepted')}
                            className="bg-orange-500 hover:bg-orange-600 text-white py-1.5 px-4 rounded-lg text-xs font-bold shadow-sm transition-all"
                          >
                            Accept
                          </button>
                        </>
                      )}

                      {order.status === 'accepted' && (
                        <button
                          onClick={() => updateStatus(order.id, 'preparing')}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-105"
                        >
                          Start Preparing
                        </button>
                      )}

                      {(order.status === 'preparing' || order.status === 'assigned') && (
                        <button
                          onClick={() => updateStatus(order.id, 'ready')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all hover:scale-105"
                        >
                          Mark Ready
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          <CheckCircleOutlined /> Ready for Pickup
                        </div>
                      )}

                      {order.status === 'arrived' && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                          <CarOutlined /> Driver Arrived
                        </div>
                      )}

                      {(order.status === 'delivered' || order.status === 'completed') && (
                        <div className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-100">
                          Completed
                        </div>
                      )}

                      {order.status === 'cancelled' && (
                        <div className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100">
                          Cancelled
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
              <ClockCircleOutlined className="text-3xl" />
            </div>
            <h3 className="text-gray-800 font-bold mb-1">
              No {selectedStatus} orders
            </h3>
            <p className="text-gray-400 text-sm">
              When new orders arrive, they will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
