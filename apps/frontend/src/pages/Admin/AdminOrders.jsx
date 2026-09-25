import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import socket from '../../socket';
import {
  SyncOutlined,
  ShopOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CarOutlined,
  FilterOutlined,
  EyeOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { Modal, Tag } from 'antd';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [counts, setCounts] = useState({
    pending: 0,
    accepted: 0,
    preparing: 0,
    ready: 0,
    picked_up: 0,
    delivered: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get('/restaurants');
      if (response.data.success) {
        setRestaurants(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      let url = `/admin/orders?status=${selectedStatus}&page=${currentPage}&limit=${pageSize}`;
      if (selectedRestaurant) url += `&restaurantId=${selectedRestaurant}`;
      if (selectedMonth) url += `&month=${selectedMonth}`;
      if (selectedYear) url += `&year=${selectedYear}`;

      const response = await axios.get(url);
      if (response.data.success) {
        const filteredOrders = (response.data.data || []).filter(order => order.status !== 'refunded');
        setOrders(filteredOrders);

        if (response.data.counts) {
          setCounts({
            pending: response.data.counts.pending || 0,
            accepted: response.data.counts.accepted || 0,
            preparing: response.data.counts.preparing || 0,
            ready: response.data.counts.ready || 0,
            picked_up: response.data.counts.picked_up || 0,
            delivered: response.data.counts.delivered || 0,
            cancelled: response.data.counts.cancelled || 0
          });
        }

        if (response.data.pagination) {
          setTotalOrders(response.data.pagination.total || 0);
          setTotalPages(response.data.pagination.totalPages || 1);
        }
      }
    } catch (error) {
      console.error('Error fetching global orders:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedStatus, currentPage, pageSize, selectedRestaurant, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time live auto-update via WebSocket without page refresh
  useEffect(() => {
    socket.connect();
    socket.emit('join', 'role_admin');
    socket.emit('join_admin');

    const handleOrderEvent = () => {
      fetchOrders(true);
    };

    socket.on('NEW_ORDER', handleOrderEvent);
    socket.on('ORDER_STATUS_UPDATED', handleOrderEvent);
    socket.on('ORDER_READY_FOR_PICKUP', handleOrderEvent);
    socket.on('DRIVER_ASSIGNED', handleOrderEvent);
    socket.on('AVAILABLE_DELIVERY', handleOrderEvent);

    return () => {
      socket.off('NEW_ORDER', handleOrderEvent);
      socket.off('ORDER_STATUS_UPDATED', handleOrderEvent);
      socket.off('ORDER_READY_FOR_PICKUP', handleOrderEvent);
      socket.off('DRIVER_ASSIGNED', handleOrderEvent);
      socket.off('AVAILABLE_DELIVERY', handleOrderEvent);
    };
  }, [fetchOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRestaurant, selectedStatus, pageSize, selectedMonth, selectedYear]);

  const statusTabs = [
    { key: 'pending', label: 'Pending', icon: <ClockCircleOutlined />, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { key: 'accepted', label: 'Accepted', icon: <CheckCircleOutlined />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { key: 'preparing', label: 'Preparing', icon: <SyncOutlined />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { key: 'ready', label: 'Ready for Pickup', icon: <CheckCircleOutlined />, color: 'text-amber-500', bg: 'bg-amber-50' },
    { key: 'picked_up', label: 'On the way', icon: <CarOutlined />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircleOutlined />, color: 'text-green-500', bg: 'bg-green-50' },
    { key: 'cancelled', label: 'Cancelled', icon: <CloseCircleOutlined />, color: 'text-red-500', bg: 'bg-red-50' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
      case 'placed':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><ClockCircleOutlined className="mr-1" /> Pending</span>;
      case 'accepted':
      case 'confirmed':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><CheckCircleOutlined className="mr-1" /> Accepted</span>;
      case 'preparing':
        return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><SyncOutlined spin className="mr-1" /> Preparing</span>;
      case 'ready':
      case 'ready_for_pickup':
        return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><CheckCircleOutlined className="mr-1" /> Ready for Pickup</span>;
      case 'assigned':
        return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><CarOutlined className="mr-1" /> Driver Assigned</span>;
      case 'arrived':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><CarOutlined className="mr-1" /> Driver Arrived</span>;
      case 'picked_up':
      case 'out_for_delivery':
      case 'in_transit':
      case 'delivering':
      case 'on_the_way':
        return <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><CarOutlined className="mr-1" /> On the Way</span>;
      case 'delivered':
      case 'completed':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><CheckCircleOutlined className="mr-1" /> Delivered</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase"><CloseCircleOutlined className="mr-1" /> Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const months = [
    { value: '', label: 'All Months' },
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = [
    { value: '', label: 'All Years' },
    ...Array.from({ length: 5 }, (_, i) => ({ value: currentYear - i, label: currentYear - i }))
  ];

  const showOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsModalVisible(true);
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto p-4 md:p-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Global Order Tracking</h1>
          <p className="text-gray-500 font-medium">Monitor and manage all system transactions</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Searchable Restaurant Filter */}
          <div className="relative flex-1 md:flex-none">
            <div 
              className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-soft border border-gray-100 min-w-[220px] cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <ShopOutlined className="text-primary ml-2" />
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Restaurant</div>
                <div className="text-sm font-bold text-gray-700 truncate">
                  {selectedRestaurant ? restaurants.find(r => r.id === selectedRestaurant)?.name : 'All Restaurants'}
                </div>
              </div>
              <FilterOutlined className="text-gray-300 text-xs mr-2" />
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Search restaurant..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                  <div 
                    className={`px-4 py-3 text-sm font-bold cursor-pointer hover:bg-primary/5 transition-colors ${!selectedRestaurant ? 'text-primary bg-primary/5' : 'text-gray-600'}`}
                    onClick={() => {
                      setSelectedRestaurant('');
                      setIsDropdownOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    All Restaurants
                  </div>
                  {filteredRestaurants.map(r => (
                    <div 
                      key={r.id}
                      className={`px-4 py-3 text-sm font-bold cursor-pointer hover:bg-primary/5 transition-colors ${selectedRestaurant === r.id ? 'text-primary bg-primary/5' : 'text-gray-600'}`}
                      onClick={() => {
                        setSelectedRestaurant(r.id);
                        setIsDropdownOpen(false);
                        setSearchTerm('');
                      }}
                    >
                      {r.name}
                    </div>
                  ))}
                  {filteredRestaurants.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-400 text-xs font-medium">
                      No restaurants found
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Click outside to close */}
            {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />}
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-soft border border-gray-100 flex-1 md:flex-none">
            <ClockCircleOutlined className="text-primary ml-2" />
            <div className="flex-1 pr-2">
              <div className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Month</div>
              <select
                className="outline-none bg-transparent text-sm font-bold text-gray-700 w-full cursor-pointer appearance-none"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl shadow-soft border border-gray-100 flex-1 md:flex-none">
            <ClockCircleOutlined className="text-primary ml-2" />
            <div className="flex-1 pr-2">
              <div className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Year</div>
              <select
                className="outline-none bg-transparent text-sm font-bold text-gray-700 w-full cursor-pointer appearance-none"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map(y => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-nowrap gap-3.5 items-center mb-7 overflow-x-auto pt-3 pb-5 no-scrollbar px-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold transition-all whitespace-nowrap border-2 ${
              selectedStatus === tab.key
                ? `${tab.bg} ${tab.color} border-current shadow-md scale-105 z-10`
                : 'bg-white text-gray-400 border-gray-50 hover:border-gray-100 hover:text-gray-500 shadow-sm'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[13px] tracking-tight">{tab.label}</span>
            <span
              className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-black ${
                selectedStatus === tab.key ? 'bg-white shadow-inner' : 'bg-gray-100'
              }`}
            >
              {counts[tab.key] || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100 overflow-hidden min-h-[500px] mb-12">
        {loading ? (
          <div className="py-32 text-center flex flex-col items-center">
            <SyncOutlined spin className="text-4xl mb-4 text-primary/30" />
            <p className="font-bold text-gray-400 uppercase tracking-[0.2em] text-xs">Syncing Live Data</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b text-gray-400 text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="p-8">Order Logistics</th>
                  <th className="p-8">Partner Details</th>
                  <th className="p-8">Customer</th>
                  <th className="p-8">Financials</th>
                  <th className="p-8">Live Status</th>
                  <th className="p-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="p-8">
                      <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-mono inline-block mb-2 font-bold group-hover:bg-primary group-hover:text-white transition-colors">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-[10px] text-gray-400 font-black block uppercase tracking-widest">
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                          <ShopOutlined />
                        </div>
                        <span className="text-sm font-black text-gray-700 tracking-tight">{order.Restaurant?.name}</span>
                      </div>
                    </td>

                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                          <UserOutlined />
                        </div>
                        <span className="text-sm font-bold text-gray-600">{order.Customer?.User?.full_name}</span>
                      </div>
                    </td>

                    <td className="p-8">
                      <div className="text-base font-black text-gray-900 tracking-tighter">
                        ₹{Number(order.total ?? order.total_amount ?? 0).toFixed(2)}
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase font-bold tracking-[0.15em] mt-1">
                        Pay via: <span className="text-primary">{order.payment_method}</span>
                      </div>
                    </td>

                    <td className="p-8">
                      {getStatusBadge(order.status)}
                    </td>

                    <td className="p-8 text-right">
                      <button 
                        onClick={() => showOrderDetail(order)}
                        className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all duration-300 shadow-sm border border-primary/5"
                        title="View Details"
                      >
                        <EyeOutlined className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-32 text-center text-gray-400 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-gray-100">
              <ClockCircleOutlined className="text-3xl text-gray-200" />
            </div>
            <h3 className="font-black text-gray-800 text-lg mb-2">No {selectedStatus} orders</h3>
            <p className="text-sm max-w-[250px] mx-auto text-gray-400 font-medium">
              There are currently no orders with this status for the selected criteria.
            </p>
          </div>
        )}

        {!loading && totalOrders > 0 && (
          <div className="px-6 md:px-8 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-gray-500">
              Showing {Math.min((currentPage - 1) * pageSize + 1, totalOrders)}-
              {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders} orders
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-9 px-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>

              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              <span className="text-xs font-bold text-gray-600 min-w-[70px] text-center">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 py-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/10">
              <FileTextOutlined className="text-lg" />
            </div>
            <div>
              <div className="text-gray-900 font-black text-lg leading-tight uppercase tracking-tight">
                Order #{selectedOrder?.id?.slice(0, 8).toUpperCase()}
              </div>
              <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                {selectedOrder && new Date(selectedOrder.created_at).toLocaleString('en-GB', { 
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        centered
        className="premium-modal"
        styles={{ 
          body: { padding: '0px' },
          mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.3)' }
        }}
      >
        {selectedOrder && (
          <div className="animate-in fade-in duration-500">
            {/* Scrollable container */}
            <div className="max-h-[80vh] overflow-y-auto p-8 custom-scrollbar">
              {/* Top Status Bar */}
              <div className="flex justify-between items-center mb-8 bg-gray-50/80 p-5 rounded-[2rem] border border-gray-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Transaction Status</span>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Payment Method</span>
                  <div className="mt-1 flex items-center justify-end gap-2 text-sm font-black text-gray-800">
                    <WalletOutlined className="text-primary" />
                    {selectedOrder.payment_method?.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Customer Section */}
                <div className="relative">
                  <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100/50 h-full">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <UserOutlined />
                      </div>
                      <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">Customer Details</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] text-blue-400 font-black uppercase leading-none mb-1.5">Full Name</div>
                        <div className="text-sm font-black text-gray-800">{selectedOrder.Customer?.User?.full_name}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-400 font-black uppercase leading-none mb-1.5">Contact Phone</div>
                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <PhoneOutlined className="text-blue-300" />
                          {selectedOrder.Customer?.User?.phone_number || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-400 font-black uppercase leading-none mb-1.5">Delivery Address</div>
                        <div className="text-sm font-bold text-gray-700 leading-relaxed flex items-start gap-2">
                          <EnvironmentOutlined className="text-blue-300 mt-0.5" />
                          <span>
                            {selectedOrder.Address?.label ? `[${selectedOrder.Address.label}] ` : ''}
                            {selectedOrder.Address?.street}, {selectedOrder.Address?.city}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Section */}
                <div>
                  <div className="bg-orange-50/50 p-6 rounded-[2.5rem] border border-orange-100/50 h-full">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <ShopOutlined />
                      </div>
                      <h4 className="text-xs font-black text-orange-900 uppercase tracking-widest">Restaurant Partner</h4>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="text-[10px] text-orange-400 font-black uppercase leading-none mb-1.5">Station Name</div>
                        <div className="text-sm font-black text-gray-800">{selectedOrder.Restaurant?.name}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-orange-400 font-black uppercase leading-none mb-1.5">Merchant Phone</div>
                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <PhoneOutlined className="text-orange-300" />
                          {selectedOrder.Restaurant?.User?.phone_number || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-orange-400 font-black uppercase leading-none mb-1.5">Pickup Location</div>
                        <div className="text-sm font-bold text-gray-700 leading-relaxed flex items-start gap-2">
                          <EnvironmentOutlined className="text-orange-300 mt-0.5" />
                          {selectedOrder.Restaurant?.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Driver Section */}
              <div className="mb-8 relative overflow-hidden">
                <div className={`p-6 rounded-[2.5rem] border transition-all ${selectedOrder.DeliveryPartner ? 'bg-teal-50/50 border-teal-100/50' : 'bg-gray-50/50 border-gray-200 border-dashed shadow-inner'}`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedOrder.DeliveryPartner ? 'bg-teal-500 shadow-teal-200' : 'bg-gray-300'}`}>
                      <CarOutlined />
                    </div>
                    <h4 className={`text-xs font-black uppercase tracking-widest ${selectedOrder.DeliveryPartner ? 'text-teal-900' : 'text-gray-500'}`}>Logistics Agent</h4>
                    {!selectedOrder.DeliveryPartner && (
                      <span className="text-[9px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-black uppercase ml-2 animate-pulse">Unassigned</span>
                    )}
                  </div>

                  {selectedOrder.DeliveryPartner ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[10px] text-teal-400 font-black uppercase leading-none mb-1.5">Driver Name</div>
                        <div className="text-sm font-black text-gray-800">{selectedOrder.DeliveryPartner?.User?.full_name}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-teal-400 font-black uppercase leading-none mb-1.5">Agent Phone</div>
                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                          <PhoneOutlined className="text-teal-300" />
                          {selectedOrder.DeliveryPartner?.User?.phone_number || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-gray-400 font-medium">No driver has been assigned to this order yet.</p>
                      <div className="flex justify-center gap-1 mt-2">
                         <div className="w-1 h-1 bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                         <div className="w-1 h-1 bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                         <div className="w-1 h-1 bg-gray-200 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6 ml-1">
                  <div className="w-1 h-5 bg-primary rounded-full"></div>
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Purchase Details</h4>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] text-gray-400 font-black uppercase tracking-widest">Menu Item</th>
                        <th className="px-6 py-4 text-[10px] text-gray-400 font-black uppercase tracking-widest text-center">Qty</th>
                        <th className="px-6 py-4 text-[10px] text-gray-400 font-black uppercase tracking-widest text-right">Price</th>
                        <th className="px-6 py-4 text-[10px] text-gray-400 font-black uppercase tracking-widest text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(selectedOrder.items || selectedOrder.OrderItems || [])?.map((item) => {
                        const mItem = item.menuItem || item.MenuItem;
                        return (
                          <tr key={item.id}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {mItem?.image_url ? (
                                  <img src={mItem.image_url} alt={mItem.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                                ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                                  <ShopOutlined />
                                </div>
                              )}
                              <span className="text-sm font-bold text-gray-700">{mItem?.name || item.name || 'Food Item'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-black text-gray-600">x{item.quantity}</span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-500 font-medium">
                            ₹{Number(mItem?.price || item.unit_price || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-black text-gray-900">
                            ₹{Number(item.total_price || item.subtotal || 0).toFixed(2)}
                          </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                  <WalletOutlined className="text-8xl" />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-xs font-bold uppercase tracking-widest">Cart Subtotal</span>
                      <span className="font-mono">₹{Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                    </div>
                    {Number(selectedOrder.discount_amount || selectedOrder.discountAmount || 0) > 0 && (
                      <div className="flex justify-between items-center text-emerald-400">
                        <span className="text-xs font-bold uppercase tracking-widest">Promo Discount ({selectedOrder.coupon_code || 'COUPON'})</span>
                        <span className="font-mono">-₹{Number(selectedOrder.discount_amount || selectedOrder.discountAmount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-xs font-bold uppercase tracking-widest">Delivery Fee</span>
                      <span className="font-mono">₹{Number(selectedOrder.delivery_fee ?? 30).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-xs font-bold uppercase tracking-widest">Platform Fee</span>
                      <span className="font-mono">₹{Number(selectedOrder.platform_fee ?? 5).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-400">
                      <span className="text-xs font-bold uppercase tracking-widest">GST (5%)</span>
                      <span className="font-mono">₹{Number(selectedOrder.tax ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-white/10 my-3"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-black uppercase tracking-widest text-primary">Master Total</span>
                      <span className="text-2xl font-black tracking-tighter text-white">
                        ₹{Number(selectedOrder.total ?? selectedOrder.total_amount ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center text-white text-xs">
                          <CheckCircleOutlined />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Payment Status</p>
                          <p className="text-sm font-black text-white uppercase">{selectedOrder.payment_status || 'PAID'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsModalVisible(false)}
                      className="w-full bg-white text-gray-900 font-black uppercase tracking-widest py-3 rounded-2xl hover:bg-primary hover:text-white transition-all transform active:scale-95"
                    >
                      Close Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
