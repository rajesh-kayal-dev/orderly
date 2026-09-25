import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import socket from '../../socket';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import EmptyState from '../../components/common/EmptyState';
import { message, notification, Modal, Input, Button } from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  CopyOutlined,
  RightOutlined,
  PhoneOutlined,
  CheckCircleFilled,
  CarOutlined,
  CloseCircleFilled,
  ReloadOutlined,
  CloseOutlined,
  CompassOutlined,
  UserOutlined,
  StarFilled,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  HeartFilled
} from '@ant-design/icons';

const { TextArea } = Input;

export default function MyOrders() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Customer Feedback System State
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [feedbackSentiment, setFeedbackSentiment] = useState('Happy');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);

  const openFeedbackModal = async (order) => {
    setFeedbackOrder(order);
    setFeedbackSentiment('Happy');
    setFeedbackComment('');
    setExistingFeedback(null);
    setFeedbackModalVisible(true);

    try {
      const res = await axios.get(`/orders/${order.id}/feedback`);
      if (res.data?.success && res.data?.data) {
        setExistingFeedback(res.data.data);
        setFeedbackSentiment(res.data.data.sentiment || 'Happy');
        setFeedbackComment(res.data.data.comment || '');
      }
    } catch (err) {
      // No prior feedback
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackOrder) return;
    try {
      setSubmittingFeedback(true);
      const res = await axios.post(`/orders/${feedbackOrder.id}/feedback`, {
        sentiment: feedbackSentiment,
        comment: feedbackComment
      });
      if (res.data?.success) {
        notification.success({
          message: existingFeedback ? 'Feedback Updated' : 'Feedback Submitted!',
          description: `Thank you for rating your meal as "${feedbackSentiment}".`,
          placement: 'topRight'
        });
        setFeedbackModalVisible(false);
      }
    } catch (err) {
      notification.error({
        message: 'Feedback Failed',
        description: err.response?.data?.message || err.message,
        placement: 'topRight'
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/orders/me');
      if (res.data?.success && Array.isArray(res.data.data)) {
        // Map backend orders to standard format and sort newest first
        const apiOrders = res.data.data.map(o => {
          const restName = o.restaurant?.name || o.Restaurant?.name || 'Orderly Restaurant';
          const restLocation = o.restaurant?.address || o.restaurant?.location || o.Restaurant?.address || 'Local City';
          const restLogo = o.restaurant?.image_url || o.Restaurant?.image_url || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100';
          const restPhone = o.restaurant?.user?.phone_number || o.restaurant?.phone_number || o.Restaurant?.phone_number || '+91 98765 43210';
          
          const itemsArr = o.items || o.OrderItems || [];
          const parsedItems = itemsArr.map((it, idx) => ({
            id: it.menuItem?.id || it.menu_item_id || it.id || `it-${idx}`,
            name: it.menuItem?.name || it.name || 'Delicious Meal',
            variant: 'Regular',
            quantity: it.quantity || 1,
            price: Number(it.price || it.unit_price || it.menuItem?.price || 129.00),
            image: it.menuItem?.image_url || it.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200'
          }));

          const rawTotal = Number(o.total ?? o.total_amount ?? o.totalAmount ?? 0);
          const rawDiscount = Number(o.discount_amount ?? o.discountAmount ?? o.discount ?? 0);
          const rawSubtotal = Number(o.subtotal ?? 0);
          const itemsSubtotal = parsedItems.reduce((acc, it) => acc + (Number(it.price || 0) * (it.quantity || 1)), 0);
          const subtotal = rawSubtotal > 0 ? rawSubtotal : (itemsSubtotal > 0 ? itemsSubtotal : 0);
          const discountAmount = rawDiscount;
          const couponCode = o.coupon_code || o.couponCode || (discountAmount > 0 ? 'FLAT50' : null);
          const deliveryFee = Number(o.delivery_fee ?? o.deliveryFee ?? (subtotal > 0 ? 30.00 : 0));
          const platformFee = Number(o.platform_fee ?? o.platformFee ?? (subtotal > 0 ? 5.00 : 0));
          const taxableAmount = Math.max(0, subtotal - discountAmount);
          const gst = Number(o.tax ?? o.gst ?? (taxableAmount * 0.05));
          const totalPaid = rawTotal > 0 ? rawTotal : Number((taxableAmount + deliveryFee + platformFee + gst).toFixed(2));

          const st = (o.status || 'placed').toLowerCase();
          const timeline = [
            { label: 'Order Placed', time: new Date(o.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true },
            { label: 'Confirmed', time: 'Confirmed', done: ['accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'].includes(st) },
            { label: 'Out for Delivery', time: 'In Transit', done: ['out_for_delivery', 'delivered', 'completed'].includes(st) },
            { label: 'Delivered', time: st === 'delivered' || st === 'completed' ? 'Delivered' : 'Pending', done: st === 'delivered' || st === 'completed' }
          ];

          const addrObj = o.deliveryAddress || o.DeliveryAddress;
          const deliveryAddressText = addrObj
            ? `${addrObj.address_line1}, ${addrObj.city}, ${addrObj.state}${addrObj.postal_code ? ` - ${addrObj.postal_code}` : ''}`
            : 'Current GPS Location, Local Area';

          return {
            id: o.id,
            orderNumber: `ORD${String(o.id).slice(0, 8).toUpperCase()}`,
            restaurant: {
              name: restName,
              location: restLocation,
              logo: restLogo,
              phone: restPhone
            },
            deliveryAddressText: deliveryAddressText,
            deliveryAddress: addrObj,
            created_at: o.created_at || o.createdAt,
            dateDisplay: new Date(o.created_at || o.createdAt).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
            }),
            status: st,
            subtotal: subtotal,
            discountAmount: discountAmount,
            couponCode: couponCode,
            deliveryFee: deliveryFee,
            platformFee: platformFee,
            gst: gst,
            totalPaid: totalPaid,
            items: parsedItems,
            timeline: timeline
          };
        }).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        setOrders(apiOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching real orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleUpdate = (data) => {
      notification.info({
        message: 'Order Status Update',
        description: `Order #${data.orderId ? data.orderId.slice(0, 8) : ''} is now ${data.status.replace(/_/g, ' ')}`,
      });
      fetchOrders();
    };

    socket.on('ORDER_STATUS_UPDATED', handleUpdate);
    return () => socket.off('ORDER_STATUS_UPDATED', handleUpdate);
  }, []);

  const handleCopyOrderNumber = (e, num) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`#${num}`);
    message.success(`Order ID #${num} copied!`);
  };

  const handleReorderSingleItem = (e, item, restaurantName) => {
    e.stopPropagation();
    dispatch(addToCartAsync({
      menu_item_id: item.id,
      quantity: item.quantity || 1,
      restaurant_id: 1,
      item: {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        restaurantName: restaurantName || 'The Food Place'
      }
    }));
    message.success(`Added ${item.name} to cart!`);
  };

  const handleReorderAll = (ord) => {
    if (!ord?.items || ord.items.length === 0) return;
    ord.items.forEach(item => {
      dispatch(addToCartAsync({
        menu_item_id: item.id,
        quantity: item.quantity || 1,
        restaurant_id: 1,
        item: {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          restaurantName: ord.restaurant?.name || 'The Food Place'
        }
      }));
    });
    message.success(`Readded ${ord.items.length} items to cart!`);
  };

  // Filter orders by tab status and search query
  const filteredOrders = orders.filter(o => {
    // Status Tab Filter
    if (activeTab === 'Ongoing') {
      const isOngoing = ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status.toLowerCase());
      if (!isOngoing) return false;
    } else if (activeTab === 'Delivered') {
      const isDelivered = ['delivered', 'completed'].includes(o.status.toLowerCase());
      if (!isDelivered) return false;
    } else if (activeTab === 'Cancelled') {
      if (o.status.toLowerCase() !== 'cancelled') return false;
    }

    // Search Query Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchRes = o.restaurant?.name.toLowerCase().includes(term);
      const matchNum = o.orderNumber.toLowerCase().includes(term);
      const matchItem = o.items.some(i => i.name.toLowerCase().includes(term));
      if (!matchRes && !matchNum && !matchItem) return false;
    }

    return true;
  });

  const renderStatusBadge = (status) => {
    const st = status.toLowerCase();
    if (st === 'delivered' || st === 'completed') {
      return (
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
          <CheckCircleFilled className="text-emerald-600 text-xs" /> Delivered
        </span>
      );
    }
    if (st === 'assigned') {
      return (
        <div className="flex flex-col items-end">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 font-bold border border-blue-200/80 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
            <UserOutlined className="text-blue-600 text-xs" /> Driver Assigned
          </span>
          <span 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/customer/tracking');
            }}
            className="text-xs font-bold text-orange-600 hover:underline mt-1 cursor-pointer"
          >
            Track Order →
          </span>
        </div>
      );
    }
    if (st === 'out_for_delivery' || st === 'picked_up' || st === 'preparing' || st === 'placed' || st === 'accepted' || st === 'ready') {
      const label = (st === 'out_for_delivery' || st === 'picked_up') ? 'Out for Delivery' : st === 'preparing' ? 'Preparing Food' : st === 'ready' ? 'Food Ready' : st === 'accepted' ? 'Confirmed' : 'Order Placed';
      return (
        <div className="flex flex-col items-end">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold border border-amber-200/80 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
            <CarOutlined className="text-amber-600 text-xs" /> {label}
          </span>
          <span 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/customer/tracking');
            }}
            className="text-xs font-bold text-orange-600 hover:underline mt-1 cursor-pointer"
          >
            Track Order →
          </span>
        </div>
      );
    }
    return (
      <span className="px-3 py-1 bg-red-50 text-red-700 font-bold border border-red-200/80 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
        <CloseCircleFilled className="text-red-500 text-xs" /> Cancelled
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -mt-16 pt-16 bg-neutral-50/60 animate-fade-in">

      {/* ── FIXED HERO BANNER ── */}
      <div className="shrink-0 bg-neutral-900 text-white border-b border-neutral-800 relative overflow-hidden">
        <img
          src="/food_banners/cooking-banner.jpg"
          alt="Orders Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-900/70 to-neutral-950/40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[11px] font-bold uppercase tracking-wider mb-1 border border-orange-500/30">
              📋 ORDERS
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">My Orders</h1>
            <p className="text-neutral-300 text-xs sm:text-sm mt-0.5 max-w-xl">
              Track, reorder, and relive your favourite meals.
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA (FIXED HEIGHT CONTAINER) ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col min-h-0 space-y-4">

        {/* SEARCH & FILTER CONTROLS BAR (FIXED TOP OF CONTENT) */}
        <div className="shrink-0 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 select-none hide-scrollbar">
            {['All Orders', 'Ongoing', 'Delivered', 'Cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input & Date Filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
              <input
                type="text"
                placeholder="Search by restaurant or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs font-semibold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-2xs"
              />
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs font-bold text-neutral-700 shadow-2xs cursor-pointer hover:bg-white transition-colors">
                <CalendarOutlined className="text-neutral-400" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-1"
                >
                  <option value="All Time">All Time</option>
                  <option value="Past 30 Days">Past 30 Days</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* ORDERS LIST (ONLY THIS SECTION SCROLLS!) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar pb-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-neutral-100 rounded-2xl h-32 animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-3.5">
              {filteredOrders.map((ord) => {
                const displayItems = ord.items.slice(0, 3);
                const remainingCount = ord.items.length - 3;
                const itemSummaryText = ord.items.map(i => i.name).slice(0, 2).join(', ') + 
                  (ord.items.length > 2 ? ` and ${ord.items.length - 2} more` : '');

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="bg-white hover:bg-neutral-50/80 border border-neutral-200/90 rounded-2xl p-5 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    {/* Left Column: Restaurant Info & Order ID */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200/60 shadow-2xs">
                        <img
                          src={ord.restaurant?.logo || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100'}
                          alt={ord.restaurant?.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-extrabold text-neutral-900 text-base leading-snug group-hover:text-orange-600 transition-colors">
                          {ord.restaurant?.name}
                        </h3>
                        <p className="text-xs text-neutral-400 font-medium">{ord.restaurant?.location}</p>
                        <p className="text-xs text-neutral-500 font-medium">{ord.dateDisplay}</p>
                        
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className="text-xs font-semibold text-neutral-400">Order ID: #{ord.orderNumber}</span>
                          <button
                            onClick={(e) => handleCopyOrderNumber(e, ord.orderNumber)}
                            className="text-neutral-400 hover:text-orange-600 transition-colors p-0.5 cursor-pointer"
                            title="Copy Order ID"
                          >
                            <CopyOutlined className="text-xs" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column: Items Thumbnails & Text Summary */}
                    <div className="flex flex-col items-start gap-2 max-w-sm">
                      <div className="flex items-center gap-2">
                        {displayItems.map((item, i) => (
                          <div key={i} className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/70 shadow-2xs flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {remainingCount > 0 && (
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-xs font-bold text-neutral-600 shadow-2xs">
                            +{remainingCount}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 font-medium line-clamp-1">
                        {itemSummaryText}
                      </p>
                    </div>

                    {/* Right Column: Status & Price */}
                    <div className="flex items-center justify-between md:justify-end gap-6 flex-shrink-0">
                      <div className="flex flex-col items-start md:items-end gap-1">
                        {renderStatusBadge(ord.status)}
                        <span className="font-black text-neutral-900 text-lg mt-1">
                          ₹{Number(ord.totalPaid ?? ord.total_amount ?? 0).toFixed(2)}
                        </span>
                        {['delivered', 'completed'].includes(ord.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openFeedbackModal(ord);
                            }}
                            className="mt-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-[11px] rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          >
                            <StarFilled className="text-xs text-amber-200" />
                            <span>Rate Meal</span>
                          </button>
                        )}
                      </div>

                      <div className="text-neutral-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all">
                        <RightOutlined className="text-base" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Orders Found"
              description={searchTerm ? `No orders match "${searchTerm}".` : "You haven't placed any food orders yet."}
            />
          )}
        </div>

      </div>

      {/* ── RIGHT SLIDE-OVER / SIDE DRAWER (ORDER DETAILS) ── */}
      {selectedOrder && (
        <>
          {/* Backdrop Overlay */}
          <div
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-2xs transition-opacity animate-fade-in"
          />

          {/* Slide-over Drawer */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col justify-between overflow-hidden animate-slide-in">
            
            {/* Drawer Top Header */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-black text-neutral-900 text-xl">Order Details</h3>
                <p className="text-xs text-neutral-400 font-semibold mt-0.5">Order ID #{selectedOrder.orderNumber}</p>
              </div>

              <div className="flex items-center gap-3">
                {renderStatusBadge(selectedOrder.status)}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <CloseOutlined className="text-sm" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              
              {/* Restaurant Header Card */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden border border-neutral-200/60 shadow-2xs flex-shrink-0">
                    <img
                      src={selectedOrder.restaurant?.logo || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100'}
                      alt={selectedOrder.restaurant?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-base leading-snug">
                      {selectedOrder.restaurant?.name}
                    </h4>
                    <p className="text-xs text-neutral-400 font-medium">{selectedOrder.restaurant?.location}</p>
                  </div>
                </div>

                <a
                  href={`tel:${selectedOrder.restaurant?.phone || '+919876543210'}`}
                  className="px-3.5 py-1.5 bg-white border border-orange-400 text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <PhoneOutlined /> Call
                </a>
              </div>

              {/* Delivery Address & Location Card */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-neutral-900 font-extrabold text-xs">
                  <CompassOutlined className="text-orange-600 text-sm" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-xs text-neutral-600 font-medium pl-6 leading-relaxed">
                  {selectedOrder.deliveryAddressText || '123 Flavor Street, Foodie City (Current Location)'}
                </p>
              </div>

              {/* Delivery Timeline Stepper */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Delivery Timeline</h5>
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between relative">
                    {selectedOrder.timeline.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step.done ? 'bg-emerald-500 text-white shadow-xs' : 'bg-neutral-200 text-neutral-400'
                        }`}>
                          ✓
                        </div>
                        <p className="text-[11px] font-bold text-neutral-800 mt-1.5 leading-tight">{step.label}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{step.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Items in this Order */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Items in this order</h5>
                <div className="bg-white border border-neutral-200/80 rounded-2xl divide-y divide-neutral-100 overflow-hidden shadow-2xs">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200/60 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h5 className="font-bold text-neutral-900 text-sm leading-snug">{item.name}</h5>
                          <p className="text-xs text-neutral-400 font-medium">{item.variant || 'Regular'}</p>
                          <p className="text-xs font-bold text-neutral-900 mt-0.5">₹{item.price.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-xs font-bold text-neutral-500">x {item.quantity}</span>
                        <button
                          onClick={(e) => handleReorderSingleItem(e, item, selectedOrder.restaurant?.name)}
                          className="px-3 py-1 bg-white border border-orange-400 text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          Reorder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-neutral-800">₹{Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                {Number(selectedOrder.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Discount ({selectedOrder.couponCode || 'PROMO'})</span>
                    <span>-₹{Number(selectedOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-neutral-800">₹{Number(selectedOrder.deliveryFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-bold text-neutral-800">₹{Number(selectedOrder.platformFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-bold text-neutral-800">₹{Number(selectedOrder.gst || 0).toFixed(2)}</span>
                </div>

                <div className="h-px bg-neutral-200 my-2" />

                <div className="flex justify-between items-center text-neutral-900 text-sm">
                  <span className="font-bold">Total Paid</span>
                  <span className="font-black text-lg text-neutral-900">₹{Number(selectedOrder.totalPaid || 0).toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Sticky Bottom Action Buttons */}
            <div className="p-5 border-t border-neutral-100 bg-white sticky bottom-0 flex flex-col gap-2.5">
              {['delivered', 'completed'].includes(selectedOrder.status) && (
                <button
                  onClick={() => openFeedbackModal(selectedOrder)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <StarFilled className="text-amber-200" /> Rate Meal & Give Feedback
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleReorderAll(selectedOrder)}
                  className="flex-1 py-3 bg-white text-orange-600 border border-orange-500 font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <ReloadOutlined /> Reorder All
                </button>

                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    navigate('/customer/tracking');
                  }}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <CompassOutlined /> Track Order →
                </button>
              </div>
            </div>

          </div>
        </>
      )}

      {/* ── CUSTOMER FEEDBACK MODAL ── */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
            <StarFilled className="text-amber-500" />
            <span>How was your meal from {feedbackOrder?.restaurant?.name || 'Orderly Kitchen'}?</span>
          </div>
        }
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setFeedbackModalVisible(false)} className="rounded-xl font-semibold">
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingFeedback}
            onClick={handleSubmitFeedback}
            className="rounded-xl font-bold bg-[#FF521C] hover:bg-[#E04310] border-none text-white px-6"
          >
            {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
          </Button>
        ]}
        width={520}
        className="rounded-2xl"
      >
        <div className="py-3 space-y-5 text-xs font-sans">
          {existingFeedback && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-semibold flex items-center gap-2">
              <StarFilled className="text-amber-500" />
              <span>You previously submitted feedback for this order. Submitting now will update your review.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Sentiment:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'Happy', label: 'Happy', emoji: '😊', icon: <SmileOutlined className="text-emerald-500 text-base" />, desc: 'Loved the food & service', activeBg: 'bg-emerald-50 border-emerald-500 text-emerald-900' },
                { key: 'Satisfied', label: 'Satisfied', emoji: '🙂', icon: <SmileOutlined className="text-blue-500 text-base" />, desc: 'Good and as expected', activeBg: 'bg-blue-50 border-blue-500 text-blue-900' },
                { key: 'Unsatisfied', label: 'Unsatisfied', emoji: '😐', icon: <MehOutlined className="text-amber-500 text-base" />, desc: 'Could be improved', activeBg: 'bg-amber-50 border-amber-500 text-amber-900' },
                { key: 'Bad', label: 'Bad', emoji: '😞', icon: <FrownOutlined className="text-rose-500 text-base" />, desc: 'Poor experience', activeBg: 'bg-rose-50 border-rose-500 text-rose-900' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFeedbackSentiment(item.key)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    feedbackSentiment === item.key
                      ? item.activeBg + ' shadow-xs ring-2 ring-orange-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-sm">{item.emoji} {item.label}</span>
                    {item.icon}
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Comments (Optional):
            </label>
            <TextArea
              rows={3}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Tell us what you liked or what could be improved about the taste, temperature, or packaging..."
              className="text-xs rounded-xl p-3 border-slate-200 focus:border-[#FF521C]"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
