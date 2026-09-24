import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import socket from '../../socket';
import { addToCartAsync } from '../../redux/slices/cartSlice';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { message, Modal, Input, Button, Rate } from 'antd';
const { TextArea } = Input;
import {
  CopyOutlined,
  PhoneOutlined,
  MessageOutlined,
  RightOutlined,
  ReloadOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  CarOutlined,
  HomeOutlined,
  StarFilled,
  StarOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CompassOutlined,
  ShoppingOutlined,
  SearchOutlined,
  UserOutlined,
  CloseCircleOutlined,
  FireOutlined,
  CheckOutlined,
  UnorderedListOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  HeartFilled,
  EditOutlined,
  LikeOutlined
} from '@ant-design/icons';

// Custom Leaflet Icons for Map
const restaurantPinIcon = new L.DivIcon({
  className: "custom-rest-icon",
  html: `<div style="background-color:#FF5722; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; box-shadow:0 4px 12px rgba(255,87,34,0.4); border:3px solid white;">🍴</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const driverPinIcon = new L.DivIcon({
  className: "custom-driver-icon",
  html: `<div style="background-color:#FF6B35; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:22px; box-shadow:0 4px 14px rgba(255,107,53,0.5); border:3px solid white; animation: pulse 2s infinite;">🛵</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const destinationPinIcon = new L.DivIcon({
  className: "custom-dest-icon",
  html: `<div style="background-color:#10B981; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:18px; box-shadow:0 4px 12px rgba(16,185,129,0.4); border:3px solid white;">📍</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

function MapRecenter({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && Array.isArray(bounds) && bounds.length >= 2) {
      const valid = bounds.every(b => Array.isArray(b) && b.length === 2 && !isNaN(b[0]) && !isNaN(b[1]));
      if (valid) {
        try {
          map.fitBounds(bounds, { padding: [40, 40] });
        } catch (e) {
          // ignore map bounds error
        }
      }
    }
  }, [bounds, map]);
  return null;
}

export const getStatusLevel = (statusStr) => {
  const st = (statusStr || 'placed').toLowerCase();
  if (st === 'cancelled') return 0;
  if (st === 'payment_pending' || st === 'pending' || st === 'placed') return 1;
  if (st === 'accepted' || st === 'confirmed') return 2;
  if (st === 'preparing' || st === 'ready' || st === 'ready_for_pickup') return 3;
  if (st === 'assigned' || st === 'arrived') return 4;
  if (st === 'picked_up' || st === 'out_for_delivery' || st === 'in_transit') return 5;
  if (st === 'delivered' || st === 'completed') return 6;
  return 1;
};

const formatStatusDisplay = (statusStr) => {
  const st = (statusStr || 'placed').toLowerCase();
  if (st === 'payment_pending') return 'Payment Pending';
  if (st === 'placed' || st === 'pending') return 'Order Placed';
  if (st === 'accepted' || st === 'confirmed') return 'Order Confirmed';
  if (st === 'preparing') return 'Preparing Food';
  if (st === 'ready' || st === 'ready_for_pickup') return 'Ready for Pickup';
  if (st === 'assigned' || st === 'arrived') return 'Driver Assigned';
  if (st === 'picked_up') return 'Food Picked Up';
  if (st === 'out_for_delivery' || st === 'in_transit') return 'Out for Delivery';
  if (st === 'delivered' || st === 'completed') return 'Delivered';
  if (st === 'cancelled') return 'Cancelled';
  return st.charAt(0).toUpperCase() + st.slice(1).replace(/_/g, ' ');
};

const getStatusBadgeClass = (statusStr) => {
  const st = (statusStr || 'placed').toLowerCase();
  if (st === 'delivered' || st === 'completed') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (st === 'cancelled') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (st === 'out_for_delivery' || st === 'in_transit' || st === 'picked_up') {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (st === 'preparing' || st === 'ready' || st === 'ready_for_pickup') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-orange-50 text-orange-700 border-orange-200';
};

const formatOrderDateTime = (isoDate) => {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dateStr}, ${timeStr}`;
  } catch (e) {
    return '';
  }
};

// Generates smooth multi-waypoint road route between restaurant and customer
const generateRouteWaypoints = (restCoords, custCoords) => {
  const [rLat, rLng] = restCoords || [22.7196, 75.8577];
  const [cLat, cLng] = custCoords || [22.7533, 75.8937];
  
  return [
    [rLat, rLng],
    [rLat + (cLat - rLat) * 0.25 + 0.0018, rLng + (cLng - rLng) * 0.20 - 0.0012],
    [rLat + (cLat - rLat) * 0.50 - 0.0010, rLng + (cLng - rLng) * 0.55 + 0.0025],
    [rLat + (cLat - rLat) * 0.75 + 0.0012, rLng + (cLng - rLng) * 0.80 - 0.0015],
    [cLat, cLng]
  ];
};

const interpolatePosition = (routePoints, progress) => {
  if (!routePoints || routePoints.length === 0) return [22.7196, 75.8577];
  if (progress <= 0) return routePoints[0];
  if (progress >= 1) return routePoints[routePoints.length - 1];

  const totalSegments = routePoints.length - 1;
  const scaledProgress = progress * totalSegments;
  const index = Math.floor(scaledProgress);
  const segmentT = scaledProgress - index;

  const p1 = routePoints[index];
  const p2 = routePoints[Math.min(index + 1, routePoints.length - 1)];

  const lat = p1[0] + (p2[0] - p1[0]) * segmentT;
  const lng = p1[1] + (p2[1] - p1[1]) * segmentT;
  return [lat, lng];
};

export default function OrderTracking() {
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId') || sessionStorage.getItem('last_guest_order_id');
  const guestToken = sessionStorage.getItem('guest_token') || localStorage.getItem('guest_token');

  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Live Driver Real-time Movement & GPS state
  const [trackProgress, setTrackProgress] = useState(0.0);
  const [socketDriverPos, setSocketDriverPos] = useState(null);

  // Customer Feedback & Review Modal State
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackSentiment, setFeedbackSentiment] = useState('Happy');
  const [feedbackStarRating, setFeedbackStarRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [reviewedOrders, setReviewedOrders] = useState({});
  const promptedOrdersRef = React.useRef(new Set());

  const openFeedbackModal = async (orderToReview) => {
    const targetOrder = orderToReview || currentOrder;
    if (!targetOrder) return;
    
    setFeedbackSentiment('Happy');
    setFeedbackStarRating(5);
    setFeedbackComment('');
    setExistingFeedback(null);
    setFeedbackModalVisible(true);

    try {
      const res = await axios.get(`/orders/${targetOrder.id}/feedback`);
      if (res.data?.success && res.data?.data) {
        const fb = res.data.data;
        setExistingFeedback(fb);
        setFeedbackSentiment(fb.sentiment || 'Happy');
        const starMap = { Happy: 5, Satisfied: 4, Unsatisfied: 3, Bad: 2 };
        setFeedbackStarRating(starMap[fb.sentiment] || 5);
        setFeedbackComment(fb.comment || '');
        setReviewedOrders(prev => ({ ...prev, [targetOrder.id]: fb }));
      }
    } catch (err) {
      // No prior feedback
    }
  };

  const handleSentimentChange = (sentimentKey) => {
    setFeedbackSentiment(sentimentKey);
    const starMap = { Happy: 5, Satisfied: 4, Unsatisfied: 3, Bad: 2 };
    setFeedbackStarRating(starMap[sentimentKey] || 5);
  };

  const handleStarChange = (stars) => {
    setFeedbackStarRating(stars);
    if (stars >= 5) setFeedbackSentiment('Happy');
    else if (stars === 4) setFeedbackSentiment('Satisfied');
    else if (stars === 3) setFeedbackSentiment('Unsatisfied');
    else setFeedbackSentiment('Bad');
  };

  const handleTagClick = (tagText) => {
    setFeedbackComment(prev => {
      if (!prev) return tagText;
      if (prev.includes(tagText)) return prev;
      return `${prev}, ${tagText}`;
    });
  };

  const handleSubmitFeedback = async () => {
    const targetOrder = currentOrder;
    if (!targetOrder) return;
    try {
      setSubmittingFeedback(true);
      const res = await axios.post(`/orders/${targetOrder.id}/feedback`, {
        sentiment: feedbackSentiment,
        comment: feedbackComment
      });
      if (res.data?.success) {
        message.success(existingFeedback ? 'Review updated successfully! Thank you.' : 'Review submitted successfully! Thank you for rating your food.');
        const updatedFb = { sentiment: feedbackSentiment, comment: feedbackComment };
        setExistingFeedback(updatedFb);
        setReviewedOrders(prev => ({ ...prev, [targetOrder.id]: updatedFb }));
        setFeedbackModalVisible(false);
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const parseOrderRecord = (foundActive) => {
    if (!foundActive) return null;
    const st = (foundActive.status || 'placed').toLowerCase();
    const itemsArr = foundActive.items || foundActive.OrderItems || [];
    const parsedItems = itemsArr.map((it, idx) => ({
      id: it.menuItem?.id || it.menuItemId || it.menu_item_id || it.id || `it-${idx}`,
      name: it.menuItem?.name || it.name || it.menuItemName || 'Food Item',
      variant: 'Regular',
      quantity: it.quantity || 1,
      price: Number(it.price || it.unitPrice || it.unit_price || it.menuItem?.price || 120.00),
      image: it.menuItem?.image_url || it.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200'
    }));

    const totalPaid = Number(foundActive.total ?? foundActive.total_amount ?? foundActive.totalAmount ?? 0);
    const discountAmount = Number(foundActive.discount_amount ?? foundActive.discountAmount ?? foundActive.discount ?? 0);
    const couponCode = foundActive.coupon_code || foundActive.couponCode || null;
    const deliveryFee = Number(foundActive.delivery_fee ?? foundActive.deliveryFee ?? (totalPaid > 0 ? 30.00 : 0));
    const platformFee = Number(foundActive.platform_fee ?? foundActive.platformFee ?? (totalPaid > 0 ? 5.00 : 0));
    const subtotal = Number(foundActive.subtotal ?? Math.max(0, totalPaid - deliveryFee - platformFee + discountAmount));
    const gst = Number(foundActive.tax ?? foundActive.gst ?? (Math.max(0, subtotal - discountAmount) * 0.05));

    const addrObj = foundActive.deliveryAddress || foundActive.DeliveryAddress;
    const deliveryAddressText = typeof foundActive.delivery_address === 'string' && foundActive.delivery_address
      ? foundActive.delivery_address
      : addrObj
      ? `${addrObj.street || addrObj.address_line1 || 'Address'}, ${addrObj.city || 'Indore'}`
      : 'Delivery Address Specified at Checkout';

    const custCoords = (addrObj && addrObj.latitude && addrObj.longitude)
      ? [parseFloat(addrObj.latitude), parseFloat(addrObj.longitude)]
      : [22.7533, 75.8937];

    const restCoords = (foundActive.restaurant?.latitude && foundActive.restaurant?.longitude)
      ? [parseFloat(foundActive.restaurant.latitude), parseFloat(foundActive.restaurant.longitude)]
      : [22.7196, 75.8577];
    
    const driverUser = foundActive.deliveryPartner?.user || foundActive.DeliveryPartner?.User;
    const partnerData = foundActive.deliveryPartner || foundActive.DeliveryPartner;
    
    return {
      id: foundActive.id,
      orderNumber: `ORD${String(foundActive.id).slice(0, 8).toUpperCase()}`,
      status: st,
      statusDisplay: formatStatusDisplay(st),
      version: foundActive.version || 1,
      created_at: foundActive.created_at || foundActive.createdAt || new Date().toISOString(),
      estimatedTime: st === 'delivered' || st === 'completed' ? 'Delivered' : st === 'cancelled' ? 'Cancelled' : '25 – 35 minutes',
      restaurant: {
        id: foundActive.restaurant?.id || foundActive.Restaurant?.id || foundActive.restaurant_id || '1',
        name: foundActive.restaurant?.name || foundActive.Restaurant?.name || "Orderly Gourmet Hub",
        location: foundActive.restaurant?.address || foundActive.restaurant?.location || "Indore",
        logo: foundActive.restaurant?.image_url || foundActive.restaurant?.image || foundActive.Restaurant?.image_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?w=100",
        phone: foundActive.restaurant?.phone_number || "+91 98345 67890"
      },
      driver: {
        name: partnerData?.fullName || partnerData?.name || driverUser?.full_name || "Vikram Singh",
        role: partnerData ? "Assigned Delivery Partner" : "Searching partner...",
        rating: partnerData?.rating || "4.9",
        deliveries: partnerData?.deliveries || "850+ deliveries",
        phone: partnerData?.phone || driverUser?.phone_number || "+91 98456 78901",
        vehicle_type: partnerData?.vehicle_type || "Motorcycle",
        vehicle_number: partnerData?.vehicle_number || "MP-09-AB-1234",
        avatar: partnerData?.image || partnerData?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
      },
      deliveryAddressText: deliveryAddressText,
      deliveryAddress: addrObj,
      mapData: {
        restaurantCoords: restCoords,
        customerCoords: custCoords
      },
      items: parsedItems,
      subtotal: subtotal,
      discountAmount: discountAmount,
      couponCode: couponCode,
      deliveryFee: deliveryFee,
      platformFee: platformFee,
      gst: gst,
      totalPaid: totalPaid
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let rawOrders = [];

      // 1. Fetch user orders from /orders/me or /orders
      try {
        const response = await axios.get('/orders/me');
        if (response.data?.success && Array.isArray(response.data.data)) {
          rawOrders = response.data.data;
        }
      } catch (err) {
        try {
          const fallbackRes = await axios.get('/orders');
          if (fallbackRes.data?.success && Array.isArray(fallbackRes.data.data)) {
            rawOrders = fallbackRes.data.data;
          }
        } catch (e) {
          // ignore
        }
      }

      // 2. If specific orderId requested, ensure that specific order is loaded & merged
      if (urlOrderId) {
        try {
          const singleRes = await axios.get(`/orders/${urlOrderId}`);
          if (singleRes.data?.success && singleRes.data.data) {
            const singleOrder = singleRes.data.data;
            const existingIdx = rawOrders.findIndex(r => r.id === singleOrder.id);
            if (existingIdx !== -1) {
              rawOrders[existingIdx] = { ...rawOrders[existingIdx], ...singleOrder };
            } else {
              rawOrders.unshift(singleOrder);
            }
          }
        } catch (singleErr) {
          // fallback
        }
      }

      if (rawOrders.length > 0) {
        const parsedOrders = rawOrders
          .map(parseOrderRecord)
          .filter(Boolean);

        // Sort strictly newest first (descending order by created_at)
        parsedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setActiveOrders(parsedOrders);

        // If orderId is provided in URL, auto-select it; otherwise select newest (index 0)
        if (urlOrderId) {
          const matchIdx = parsedOrders.findIndex(o => String(o.id) === String(urlOrderId) || o.orderNumber.toLowerCase().includes(String(urlOrderId).toLowerCase()));
          if (matchIdx !== -1) {
            setSelectedOrderIndex(matchIdx);
          } else {
            setSelectedOrderIndex(0);
          }
        } else {
          setSelectedOrderIndex(0);
        }
      } else {
        setActiveOrders([]);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setActiveOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleStatusUpdate = (data) => {
      if (!data?.orderId) return;

      setActiveOrders(prevOrders => {
        const idx = prevOrders.findIndex(o => o.id === data.orderId);
        if (idx === -1) {
          // If a new order is updated that wasn't in our list, re-fetch
          fetchOrders();
          return prevOrders;
        }

        const existing = prevOrders[idx];
        const currentLvl = getStatusLevel(existing.status);
        const incomingLvl = getStatusLevel(data.status);

        // MONOTONIC STATE GUARD: Never regress to older status level (unless explicitly cancelled)
        if (data.status !== 'cancelled' && incomingLvl < currentLvl) {
          console.warn(`[Tracking] Prevented state regression: ${data.status} (level ${incomingLvl}) vs active ${existing.status} (level ${currentLvl})`);
          return prevOrders;
        }

        const updatedStatus = data.status;
        const nextOrders = [...prevOrders];
        nextOrders[idx] = {
          ...existing,
          status: updatedStatus,
          statusDisplay: formatStatusDisplay(updatedStatus),
          version: data.version || (existing.version + 1),
          estimatedTime: updatedStatus === 'delivered' || updatedStatus === 'completed' ? 'Delivered' : updatedStatus === 'cancelled' ? 'Cancelled' : '20 – 30 mins',
        };

        message.info(`Order #${existing.orderNumber} updated: ${formatStatusDisplay(updatedStatus)}`);

        // Automatically pop up review modal when delivery completes in real-time
        if (updatedStatus === 'delivered' || updatedStatus === 'completed') {
          setTimeout(() => {
            openFeedbackModal(nextOrders[idx]);
          }, 800);
        }

        return nextOrders;
      });
    };

    const handleDriverLocation = (data) => {
      if (data && data.latitude && data.longitude) {
        setSocketDriverPos([parseFloat(data.latitude), parseFloat(data.longitude)]);
      }
    };

    socket.on('ORDER_STATUS_UPDATED', handleStatusUpdate);
    socket.on('DRIVER_LOCATION_UPDATED', handleDriverLocation);

    return () => {
      socket.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
      socket.off('DRIVER_LOCATION_UPDATED', handleDriverLocation);
    };
  }, [token, urlOrderId]);

  const currentOrder = activeOrders[selectedOrderIndex] || activeOrders[0] || null;
  const currentLevel = currentOrder ? getStatusLevel(currentOrder.status) : 1;

  // Auto-prompt review modal when order is delivered and not yet reviewed
  useEffect(() => {
    if (!currentOrder?.id) return;
    const isDelivered = currentOrder.status === 'delivered' || currentOrder.status === 'completed';
    if (isDelivered) {
      const orderKey = `feedback_prompted_${currentOrder.id}`;
      const alreadyPrompted = promptedOrdersRef.current.has(currentOrder.id) || sessionStorage.getItem(orderKey);
      if (!alreadyPrompted) {
        promptedOrdersRef.current.add(currentOrder.id);
        sessionStorage.setItem(orderKey, 'true');
        axios.get(`/orders/${currentOrder.id}/feedback`)
          .then(res => {
            if (res.data?.success && res.data?.data) {
              setReviewedOrders(prev => ({ ...prev, [currentOrder.id]: res.data.data }));
            } else {
              const timer = setTimeout(() => {
                openFeedbackModal(currentOrder);
              }, 1000);
              return () => clearTimeout(timer);
            }
          })
          .catch(() => {
            const timer = setTimeout(() => {
              openFeedbackModal(currentOrder);
            }, 1000);
            return () => clearTimeout(timer);
          });
      }
    }
  }, [currentOrder?.id, currentOrder?.status]);

  // Live Driver Real-Time Movement ONLY runs when status is out_for_delivery / in_transit / picked_up (level 5)
  useEffect(() => {
    if (currentLevel !== 5) {
      if (currentLevel < 5) setTrackProgress(0.0);
      if (currentLevel >= 6) setTrackProgress(1.0);
      return;
    }

    // Set initial out-for-delivery progress if at start
    setTrackProgress(prev => (prev <= 0 ? 0.05 : prev));

    const interval = setInterval(() => {
      setTrackProgress(prev => {
        if (prev >= 0.96) {
          return 0.96; // Driver is close at delivery doorstep awaiting final completion
        }
        return prev + 0.005;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentLevel]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-500 font-bold text-xs">Loading order tracking status...</p>
      </div>
    );
  }

  // EMPTY STATE: User has no orders in system
  if (!currentOrder || activeOrders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in pb-24">
        <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-3xl mx-auto border border-orange-100 shadow-xs">
          <ShoppingOutlined />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-neutral-900 tracking-tight">No Active Orders to Track</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
            You don't have any active orders right now. Explore top local restaurants and place an order to track live delivery in real time!
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/customer/restaurants')}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <SearchOutlined /> Browse Restaurants
          </button>

          <button
            onClick={() => navigate('/customer/menu')}
            className="px-6 py-3 bg-white hover:bg-neutral-100 text-neutral-800 font-bold text-xs rounded-xl border border-neutral-200 transition-all cursor-pointer"
          >
            Explore Menu Catalog
          </button>
        </div>
      </div>
    );
  }

  const progressWidth = currentLevel === 1 ? '0%' : currentLevel === 2 ? '20%' : currentLevel === 3 ? '40%' : currentLevel === 4 ? '60%' : currentLevel === 5 ? '80%' : '100%';

  const handleCopyOrderNumber = (num) => {
    navigator.clipboard.writeText(`#${num}`);
    message.success(`Order ID #${num} copied to clipboard!`);
  };

  const handleReorderAll = () => {
    if (!currentOrder?.items || currentOrder.items.length === 0) return;
    currentOrder.items.forEach(item => {
      dispatch(addToCartAsync({
        menu_item_id: item.id,
        quantity: item.quantity || 1,
        restaurant_id: currentOrder.restaurant?.id || '1',
        item: {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          restaurantName: currentOrder.restaurant?.name || 'Orderly Restaurant'
        }
      }));
    });
    message.success(`Added ${currentOrder.items.length} items to cart!`);
    navigate('/customer/cart');
  };

  // Dynamic status banner content
  const renderBannerContent = () => {
    if (currentLevel === 0) {
      return {
        icon: <CloseCircleOutlined />,
        title: 'Order Cancelled',
        desc: 'This order was cancelled. Contact support if you need assistance.'
      };
    }
    if (currentLevel === 1) {
      return {
        icon: <ShoppingOutlined />,
        title: 'Order Placed Successfully!',
        desc: 'Your order has been received and sent to the restaurant for confirmation.'
      };
    }
    if (currentLevel === 2) {
      return {
        icon: <CheckCircleOutlined />,
        title: 'Order Confirmed by Restaurant',
        desc: 'Restaurant confirmed your order and is preparing ingredients.'
      };
    }
    if (currentLevel === 3) {
      return {
        icon: <FireOutlined />,
        title: 'Food is Being Prepared',
        desc: 'Our chef is preparing your delicious meal with care.'
      };
    }
    if (currentLevel === 4) {
      return {
        icon: <UserOutlined />,
        title: 'Delivery Partner Assigned!',
        desc: `${currentOrder.driver?.name || 'Your delivery partner'} has accepted the order and is on the way to the restaurant for pickup.`
      };
    }
    if (currentLevel === 5) {
      return {
        icon: <CarOutlined />,
        title: 'Out for Delivery!',
        desc: `${currentOrder.driver?.name || 'Your delivery partner'} has picked up your food and is on the way to your doorstep!`
      };
    }
    return {
      icon: <HomeOutlined />,
      title: 'Order Delivered!',
      desc: 'Bon appétit! Your food has arrived. Thank you for using Orderly.'
    };
  };

  const banner = renderBannerContent();

  const routeWaypoints = generateRouteWaypoints(
    currentOrder.mapData?.restaurantCoords,
    currentOrder.mapData?.customerCoords
  );

  // Determine driver position based on order lifecycle
  let currentDriverPos = null;
  if (currentLevel >= 6) {
    currentDriverPos = currentOrder.mapData?.customerCoords || [22.7533, 75.8937];
  } else if (currentLevel === 5) {
    currentDriverPos = socketDriverPos || interpolatePosition(routeWaypoints, trackProgress);
  } else if (currentLevel === 4) {
    currentDriverPos = socketDriverPos || currentOrder.mapData?.restaurantCoords || [22.7196, 75.8577];
  } else {
    currentDriverPos = null;
  }

  const distanceRemainingKm = currentLevel >= 6 ? '0.0' : Math.max(0.1, (2.8 * (1 - trackProgress))).toFixed(1);
  const etaMinutesRemaining = currentLevel >= 6 ? 0 : Math.max(1, Math.round(25 * (1 - trackProgress)));

  const liveDistanceText =
    currentLevel >= 6
      ? `Order Delivered at destination! 🎉`
      : currentLevel === 5
      ? `${currentOrder.driver?.name || 'Delivery partner'} is on the way • ${distanceRemainingKm} km away (${etaMinutesRemaining} mins)`
      : currentLevel === 4
      ? `${currentOrder.driver?.name || 'Delivery partner'} assigned • Reaching restaurant for pickup`
      : `Order is being prepared in kitchen • Live GPS activates once out for delivery`;

  const mapCenterPos = currentDriverPos || currentOrder.mapData?.restaurantCoords || [22.7196, 75.8577];

  const dynamicBounds = [
    currentOrder.mapData?.restaurantCoords || [22.7196, 75.8577],
    ...(currentDriverPos ? [currentDriverPos] : []),
    currentOrder.mapData?.customerCoords || [22.7533, 75.8937]
  ];

  return (
    <div className="pb-20 animate-fade-in bg-neutral-50/60 min-h-screen">

      {/* ── HERO BANNER ── */}
      <div className="relative bg-neutral-900 text-white pt-10 pb-12 border-b border-neutral-800 overflow-hidden">
        <img
          src="/food_banners/cooking-banner.jpg"
          alt="Tracking Hero Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-900/80 to-neutral-950/50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              🛵 Live Order Tracking
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
              {currentLevel === 6 ? 'Order Delivered!' : currentLevel === 0 ? 'Order Cancelled' : currentLevel === 4 ? 'Delivery Partner Assigned' : currentLevel === 5 ? 'Your Order is Out for Delivery!' : 'Your Order is Being Processed'}
            </h1>
            <p className="text-neutral-300 mt-1 max-w-xl text-xs md:text-sm leading-relaxed font-medium">
              Real-time updates from {currentOrder.restaurant?.name || 'Restaurant'}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/customer/orders')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <UnorderedListOutlined /> All Orders ({activeOrders.length})
            </button>

            <div className="bg-neutral-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-neutral-700/60 shadow-lg text-xs font-bold text-neutral-200 flex items-center gap-3">
              <span className="text-orange-400 font-mono">#{currentOrder.orderNumber}</span>
              <span className="text-neutral-500">•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 uppercase text-[10px] font-black tracking-wider">
                {currentOrder.statusDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER (2-COLUMN GRID) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Multi-Order Selector Tabs */}
        {activeOrders.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 border-b border-neutral-200">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
              Your Orders:
            </span>
            {activeOrders.map((ord, idx) => (
              <button
                key={ord.id}
                onClick={() => setSelectedOrderIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  selectedOrderIndex === idx
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                }`}
              >
                <span>#{ord.orderNumber}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-600 font-extrabold uppercase">
                  {ord.statusDisplay}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN (TRACKING STEPPER & LIVE MAP) ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* CARD 1: RESTAURANT INFO & DYNAMIC STEPPER */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 md:p-8 shadow-2xs space-y-8">
              
              {/* Header: Restaurant Info & Call Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 overflow-hidden flex-shrink-0 border border-neutral-200/60 shadow-2xs">
                    <img
                      src={currentOrder.restaurant?.logo}
                      alt={currentOrder.restaurant?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-neutral-900 text-xl leading-tight">
                      {currentOrder.restaurant?.name}
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium">{currentOrder.restaurant?.location}</p>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-semibold text-neutral-400">Order ID: #{currentOrder.orderNumber}</span>
                      <button
                        onClick={() => handleCopyOrderNumber(currentOrder.orderNumber)}
                        className="text-neutral-400 hover:text-orange-600 transition-colors p-0.5 cursor-pointer"
                        title="Copy Order ID"
                      >
                        <CopyOutlined className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Call & Chat Action Buttons */}
                <div className="flex items-center gap-3 self-start sm:self-center">
                  <a
                    href={`tel:${currentOrder.restaurant?.phone || '+919834567890'}`}
                    className="px-4 py-2 bg-white border border-orange-400 text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <PhoneOutlined /> Call Restaurant
                  </a>

                  <button
                    onClick={() => message.info("Opening Orderly Customer Support...")}
                    className="px-4 py-2 bg-white border border-orange-400 text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <MessageOutlined /> Support
                  </button>
                </div>
              </div>

              {/* DYNAMIC STEPPER TIMELINE (6 STEPS) */}
              <div className="py-2">
                <div className="flex items-center justify-between relative px-2">
                  
                  {/* Connecting Track Line */}
                  <div className="absolute top-[22px] left-[6%] right-[6%] h-1 bg-neutral-200 -z-0">
                    <div
                      className="h-full bg-orange-500 transition-all duration-700"
                      style={{ width: progressWidth }}
                    />
                  </div>

                  {/* Step 1: Order Placed */}
                  <div className="flex flex-col items-center text-center relative z-10 w-20 sm:w-24">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      currentLevel >= 1
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-neutral-100 border-2 border-neutral-300 text-neutral-400'
                    }`}>
                      <CheckOutlined />
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 mt-2 leading-tight">Order Placed</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {new Date(currentOrder.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Step 2: Accepted */}
                  <div className={`flex flex-col items-center text-center relative z-10 w-20 sm:w-24 transition-opacity ${
                    currentLevel < 2 ? 'opacity-50' : 'opacity-100'
                  }`}>
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      currentLevel > 2
                        ? 'bg-orange-500 text-white shadow-md'
                        : currentLevel === 2
                        ? 'bg-orange-500 text-white ring-4 ring-orange-100 animate-pulse shadow-lg'
                        : 'bg-neutral-100 border-2 border-neutral-300 text-neutral-400'
                    }`}>
                      <CheckOutlined />
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 mt-2 leading-tight">Accepted</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {currentLevel >= 2 ? 'Confirmed' : 'Pending'}
                    </p>
                  </div>

                  {/* Step 3: Preparing */}
                  <div className={`flex flex-col items-center text-center relative z-10 w-20 sm:w-28 transition-opacity ${
                    currentLevel < 3 ? 'opacity-50' : 'opacity-100'
                  }`}>
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      currentLevel > 3
                        ? 'bg-orange-500 text-white shadow-md'
                        : currentLevel === 3
                        ? 'bg-orange-500 text-white ring-4 ring-orange-100 animate-pulse shadow-lg'
                        : 'bg-neutral-100 border-2 border-neutral-300 text-neutral-400'
                    }`}>
                      {currentLevel > 3 ? <CheckOutlined /> : <FireOutlined />}
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 mt-2 leading-tight">Preparing</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                      {currentLevel === 3 ? 'In Kitchen' : currentLevel > 3 ? 'Prepared' : 'Pending'}
                    </p>
                  </div>

                  {/* Step 4: Driver Assigned */}
                  <div className={`flex flex-col items-center text-center relative z-10 w-20 sm:w-28 transition-opacity ${
                    currentLevel < 4 ? 'opacity-50' : 'opacity-100'
                  }`}>
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      currentLevel > 4
                        ? 'bg-orange-500 text-white shadow-md'
                        : currentLevel === 4
                        ? 'bg-orange-500 text-white ring-4 ring-orange-100 animate-pulse shadow-lg'
                        : 'bg-neutral-100 border-2 border-neutral-300 text-neutral-400'
                    }`}>
                      {currentLevel > 4 ? <CheckOutlined /> : <UserOutlined />}
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 mt-2 leading-tight">Driver Assigned</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                      {currentLevel === 4 ? 'To Restaurant' : currentLevel > 4 ? 'Assigned' : 'Pending'}
                    </p>
                  </div>

                  {/* Step 5: Out for Delivery */}
                  <div className={`flex flex-col items-center text-center relative z-10 w-20 sm:w-28 transition-opacity ${
                    currentLevel < 5 ? 'opacity-50' : 'opacity-100'
                  }`}>
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      currentLevel > 5
                        ? 'bg-orange-500 text-white shadow-md'
                        : currentLevel === 5
                        ? 'bg-orange-500 text-white ring-4 ring-orange-100 animate-pulse shadow-lg'
                        : 'bg-neutral-100 border-2 border-neutral-300 text-neutral-400'
                    }`}>
                      {currentLevel > 5 ? <CheckOutlined /> : <CarOutlined />}
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 mt-2 leading-tight">Out for Delivery</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {currentLevel === 5 ? 'On the Way' : currentLevel > 5 ? 'Picked Up' : 'Pending'}
                    </p>
                  </div>

                  {/* Step 6: Delivered */}
                  <div className={`flex flex-col items-center text-center relative z-10 w-20 sm:w-24 transition-opacity ${
                    currentLevel < 6 ? 'opacity-50' : 'opacity-100'
                  }`}>
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      currentLevel === 6
                        ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                        : 'bg-neutral-100 border-2 border-neutral-300 text-neutral-400'
                    }`}>
                      {currentLevel === 6 ? <CheckCircleFilled /> : <HomeOutlined />}
                    </div>
                    <p className="text-[11px] sm:text-xs font-bold text-neutral-900 mt-2 leading-tight">Delivered</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {currentLevel === 6 ? 'Delivered!' : 'Pending'}
                    </p>
                  </div>

                </div>
              </div>

              {/* Dynamic Status Banner Container */}
              <div className="bg-orange-50/70 border border-orange-200/70 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
                    {banner.icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-sm leading-snug">
                      {banner.title}
                    </h4>
                    <p className="text-xs text-neutral-500 font-medium">
                      {banner.desc}
                    </p>
                  </div>
                </div>

                <div className="pl-0 sm:pl-6 sm:border-l sm:border-orange-200 flex flex-col items-start sm:items-end">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Estimated Time</span>
                  <div className="flex items-center gap-1.5 text-orange-600 font-black text-sm md:text-base mt-0.5">
                    <ClockCircleOutlined /> <span>{currentOrder.estimatedTime}</span>
                  </div>
                </div>
              </div>

              {/* Delivered Review Callout Box */}
              {currentLevel >= 6 && (
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border-2 border-orange-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                      ⭐
                    </div>
                    <div>
                      <h4 className="font-extrabold text-neutral-900 text-sm">
                        {reviewedOrders[currentOrder.id] || existingFeedback ? 'You Reviewed This Order!' : 'How was your meal & delivery experience?'}
                      </h4>
                      <p className="text-xs text-neutral-600 font-medium mt-0.5">
                        {reviewedOrders[currentOrder.id] || existingFeedback
                          ? `Rated "${(reviewedOrders[currentOrder.id] || existingFeedback).sentiment}" • Click to update review`
                          : `Help ${currentOrder.restaurant?.name || 'the restaurant'} and ${currentOrder.driver?.name || 'the delivery driver'} by leaving your review.`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openFeedbackModal(currentOrder)}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <StarFilled className="text-amber-200 text-xs" />
                    <span>{reviewedOrders[currentOrder.id] || existingFeedback ? 'Edit Review' : 'Write Review'}</span>
                  </button>
                </div>
              )}

            </div>

            {/* CARD 2: LIVE LOCATION & REAL MAP */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 md:p-8 shadow-2xs space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-neutral-900 text-xl">Live Location</h3>
                    {currentLevel === 5 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        LIVE GPS CONNECTED
                      </span>
                    ) : currentLevel === 4 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold border border-blue-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        DRIVER ASSIGNED
                      </span>
                    ) : currentLevel >= 6 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold border border-emerald-300">
                        <CheckCircleFilled /> DELIVERED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-extrabold border border-amber-300">
                        <ClockCircleOutlined /> PREPARING ORDER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 font-medium">
                    {currentLevel === 5
                      ? 'Track your delivery partner moving in real time'
                      : currentLevel === 4
                      ? 'Delivery partner is reaching restaurant for pickup'
                      : currentLevel >= 6
                      ? 'Your order has been delivered successfully'
                      : 'Live GPS tracking will activate once delivery partner is out for delivery'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                    currentLevel === 5
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : currentLevel === 4
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : currentLevel >= 6
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                  }`}>
                    {currentLevel === 5 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Live Delivery In Transit</span>
                      </>
                    ) : currentLevel === 4 ? (
                      <>
                        <CarOutlined className="text-blue-600" />
                        <span>Driver at Restaurant</span>
                      </>
                    ) : currentLevel >= 6 ? (
                      <>
                        <CheckCircleFilled className="text-emerald-600" />
                        <span>Order Completed</span>
                      </>
                    ) : (
                      <>
                        <ClockCircleOutlined className="text-amber-500" />
                        <span>Kitchen Preparing</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Map Container */}
              <div className="h-[380px] rounded-2xl overflow-hidden relative border border-neutral-200/80 shadow-inner z-0">
                
                {/* Floating Driver / Restaurant Info Overlay */}
                {currentLevel >= 4 ? (
                  <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-2xl p-3.5 shadow-lg flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-sm flex items-center justify-center border border-orange-200 flex-shrink-0 shadow-xs tracking-wider select-none">
                      {((currentOrder.driver?.name || 'DP').trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2)).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-neutral-900 text-xs">{currentOrder.driver?.name}</h4>
                      <p className="text-[11px] text-neutral-400 font-medium">{currentOrder.driver?.role} • {currentOrder.driver?.vehicle_type} ({currentOrder.driver?.vehicle_number})</p>
                      <p className="text-[11px] font-bold text-amber-500 flex items-center gap-1 mt-0.5">
                        <StarFilled /> {currentOrder.driver?.rating} <span className="text-neutral-400 font-normal">({currentOrder.driver?.deliveries})</span>
                      </p>
                    </div>
                    <a
                      href={`tel:${currentOrder.driver?.phone || '+919845678901'}`}
                      className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-colors ml-2 shadow-2xs"
                    >
                      <PhoneOutlined className="text-sm" />
                    </a>
                  </div>
                ) : (
                  <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md border border-neutral-200/80 rounded-2xl p-3.5 shadow-lg flex items-center gap-3 max-w-xs">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-bold border border-orange-200/60 flex-shrink-0 shadow-2xs">
                      🍴
                    </div>
                    <div>
                      <h4 className="font-extrabold text-neutral-900 text-xs">{currentOrder.restaurant?.name || 'Restaurant'}</h4>
                      <p className="text-[11px] text-neutral-400 font-medium">Preparing fresh food in kitchen</p>
                      <p className="text-[10px] text-orange-600 font-bold mt-0.5">Live tracking activates at pickup</p>
                    </div>
                  </div>
                )}

                {/* Floating Driver Status Overlay Badge */}
                <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-neutral-200/90 px-4 py-2.5 rounded-xl shadow-md text-xs font-extrabold text-neutral-800 flex items-center gap-2.5 border-l-4 border-l-orange-500">
                  <div className={`w-2.5 h-2.5 rounded-full ${currentLevel === 5 ? 'bg-orange-500 animate-ping' : currentLevel >= 6 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span>{liveDistanceText}</span>
                </div>

                {/* Leaflet Real Interactive Map */}
                <MapContainer
                  center={mapCenterPos}
                  zoom={14}
                  scrollWheelZoom={false}
                  className="w-full h-full z-0"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  <MapRecenter bounds={dynamicBounds} />

                  {/* Restaurant Marker */}
                  <Marker position={currentOrder.mapData?.restaurantCoords || [22.7196, 75.8577]} icon={restaurantPinIcon} />
                  
                  {/* Delivery Driver Marker (rendered when driver is active / on way) */}
                  {currentDriverPos && (
                    <Marker position={currentDriverPos} icon={driverPinIcon} />
                  )}

                  {/* Destination Customer Marker */}
                  <Marker position={currentOrder.mapData?.customerCoords || [22.7533, 75.8937]} icon={destinationPinIcon} />

                  {/* Full Dotted Route Path */}
                  <Polyline
                    positions={routeWaypoints}
                    color="#9CA3AF"
                    dashArray="6, 6"
                    weight={4}
                  />

                  {/* Live Traveled Route Path - only shown when out for delivery */}
                  {currentLevel === 5 && (
                    <Polyline
                      positions={routeWaypoints.slice(0, Math.max(2, Math.ceil(trackProgress * routeWaypoints.length)))}
                      color="#FF5722"
                      weight={5}
                    />
                  )}

                  {/* Completed Green Traveled Route Path when delivered */}
                  {currentLevel >= 6 && (
                    <Polyline
                      positions={routeWaypoints}
                      color="#10B981"
                      weight={5}
                    />
                  )}
                </MapContainer>

              </div>

            </div>

            {/* TRUST BADGES FOOTER BAR */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                    🌱
                  </div>
                  <div>
                    <h5 className="font-extrabold text-neutral-900 text-xs">Freshly prepared</h5>
                    <p className="text-[11px] text-neutral-400 font-medium">Hygienic & safe</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                    🕒
                  </div>
                  <div>
                    <h5 className="font-extrabold text-neutral-900 text-xs">On time delivery</h5>
                    <p className="text-[11px] text-neutral-400 font-medium">Straight to your door</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                    ❤️
                  </div>
                  <div>
                    <h5 className="font-extrabold text-neutral-900 text-xs">Local Restaurants</h5>
                    <p className="text-[11px] text-neutral-400 font-medium">Supporting your neighborhood</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN (REAL ORDER DETAILS SUMMARY & PREVIOUS ORDERS) ── */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* ── PREVIOUS & ALL ORDERS CARD (Shown when user has multiple orders) ── */}
            {activeOrders.length > 1 && (
              <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <UnorderedListOutlined className="text-orange-500 text-base" />
                    <h3 className="font-black text-neutral-900 text-sm">Your Orders ({activeOrders.length})</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-400">Newest first</span>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {activeOrders.map((ord, idx) => {
                    const isSelected = selectedOrderIndex === idx;

                    return (
                      <div
                        key={ord.id || idx}
                        onClick={() => {
                          setSelectedOrderIndex(idx);
                          navigate(`/customer/tracking?orderId=${ord.id}`, { replace: true });
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-orange-50/70 border-orange-500 shadow-xs ring-1 ring-orange-500/30'
                            : 'bg-neutral-50/60 hover:bg-neutral-100/80 border-neutral-200/80 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-neutral-900">
                              #{ord.orderNumber}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 bg-orange-600 text-white font-black text-[10px] rounded-md uppercase tracking-wider">
                                Tracking
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 font-bold text-[10px] rounded-full border ${getStatusBadgeClass(ord.status)}`}>
                            {ord.statusDisplay}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-700 truncate max-w-[160px]">
                            {ord.restaurant?.name || 'Restaurant'}
                          </span>
                          <span className="font-black text-neutral-900">
                            ₹{(ord.totalPaid || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                          <span>{ord.items?.length || 0} {ord.items?.length === 1 ? 'item' : 'items'}</span>
                          <span>{formatOrderDateTime(ord.created_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 shadow-2xs space-y-6 sticky top-24">
              
              {/* Card Header: Order Details & Dynamic Status Badge */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="font-black text-neutral-900 text-lg">Order Details</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-neutral-400 font-semibold">Order ID: #{currentOrder.orderNumber}</span>
                    <button
                      onClick={() => handleCopyOrderNumber(currentOrder.orderNumber)}
                      className="text-neutral-400 hover:text-orange-600 transition-colors p-0.5 cursor-pointer"
                      title="Copy Order ID"
                    >
                      <CopyOutlined className="text-xs" />
                    </button>
                  </div>
                </div>

                <span className="px-3 py-1 bg-orange-50 text-orange-700 font-bold text-xs rounded-full border border-orange-200 flex items-center gap-1.5 shadow-2xs">
                  🍳 {currentOrder.statusDisplay}
                </span>
              </div>

              {/* Restaurant Card */}
              <div
                onClick={() => navigate('/customer/restaurants')}
                className="bg-neutral-50/70 hover:bg-neutral-100/80 border border-neutral-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 overflow-hidden flex-shrink-0 border border-neutral-200/60 shadow-2xs">
                    <img src={currentOrder.restaurant?.logo} alt={currentOrder.restaurant?.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-900 text-xs group-hover:text-orange-600 transition-colors">
                      {currentOrder.restaurant?.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400 font-medium">{currentOrder.restaurant?.location}</p>
                  </div>
                </div>

                <RightOutlined className="text-xs text-neutral-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Delivery Address Location Card */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
                <div className="flex items-center gap-2 text-neutral-900 font-extrabold text-xs">
                  <CompassOutlined className="text-orange-600 text-sm" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-xs text-neutral-600 font-medium pl-6 leading-relaxed">
                  {currentOrder.deliveryAddressText}
                </p>
              </div>

              {/* Ordered Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-neutral-800 uppercase tracking-wider">Ordered Items ({currentOrder.items?.length || 0})</h4>
                <div className="divide-y divide-neutral-100">
                  {(currentOrder.items || []).map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200/60 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-neutral-900 text-xs leading-snug">{item.name}</h5>
                          <p className="text-[11px] text-neutral-400 font-medium">{item.variant || 'Regular'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs font-bold text-neutral-400">x {item.quantity}</span>
                        <span className="font-extrabold text-neutral-900 text-xs">₹{(item.price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Receipt Breakdown */}
              <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-2xl p-4 space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-neutral-800">₹{(currentOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                {currentOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promo Discount ({currentOrder.couponCode || 'PROMO'})</span>
                    <span>-₹{Number(currentOrder.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-neutral-800">₹{(currentOrder.deliveryFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-bold text-neutral-800">₹{(currentOrder.platformFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span className="font-bold text-neutral-800">₹{(currentOrder.gst || 0).toFixed(2)}</span>
                </div>

                <div className="h-px bg-neutral-200 my-2" />

                <div className="flex justify-between items-center text-neutral-900 text-sm">
                  <span className="font-bold">Total Paid</span>
                  <span className="font-black text-base text-neutral-900">₹{(currentOrder.totalPaid || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {currentLevel >= 6 && (
                  <button
                    onClick={() => openFeedbackModal(currentOrder)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <StarFilled className="text-amber-200 text-sm" />
                    <span>{reviewedOrders[currentOrder.id] || existingFeedback ? 'Update Your Review' : 'Write a Review & Rate Food'}</span>
                  </button>
                )}

                <button
                  onClick={handleReorderAll}
                  className="w-full py-3 bg-white text-orange-600 border border-orange-500 font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <ReloadOutlined /> Reorder This Order
                </button>

                <button
                  onClick={() => message.info("Connecting to Orderly Support team...")}
                  className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CustomerServiceOutlined /> Need Help? Contact Support
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── CUSTOMER FEEDBACK & REVIEW POPUP MODAL ── */}
      <Modal
        title={
          <div className="flex items-center gap-2.5 text-slate-900 font-black text-lg">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm">
              <StarFilled />
            </div>
            <div>
              <span>How was your meal?</span>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                {currentOrder?.restaurant?.name || 'Restaurant'} • Order #{currentOrder?.orderNumber}
              </p>
            </div>
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
            className="rounded-xl font-bold bg-[#FF521C] hover:bg-[#E04310] border-none text-white px-6 shadow-md"
          >
            {existingFeedback ? 'Update Review' : 'Submit Review'}
          </Button>
        ]}
        width={540}
        className="rounded-3xl overflow-hidden"
      >
        <div className="py-2 space-y-4 text-xs font-sans">
          {existingFeedback && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-semibold flex items-center gap-2">
              <StarFilled className="text-amber-500" />
              <span>You previously submitted feedback for this order. Submitting now will update your review.</span>
            </div>
          )}

          {/* Star Rating Bar */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-1.5 text-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Overall Rating</span>
            <Rate
              value={feedbackStarRating}
              onChange={handleStarChange}
              className="text-2xl text-amber-400"
            />
            <span className="text-xs font-extrabold text-slate-800">
              {feedbackStarRating === 5
                ? '⭐ Outstanding (5/5)'
                : feedbackStarRating === 4
                ? '⭐ Great Experience (4/5)'
                : feedbackStarRating === 3
                ? '⭐ Average (3/5)'
                : feedbackStarRating === 2
                ? '⭐ Below Expectations (2/5)'
                : '⭐ Disappointed (1/5)'}
            </span>
          </div>

          {/* Sentiment Cards */}
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
                  onClick={() => handleSentimentChange(item.key)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
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

          {/* Quick Review Tag Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Quick Highlights:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Delicious Taste 😋',
                'Super Hot & Fresh 🔥',
                'Fast Delivery ⚡',
                'Neat Packaging 📦',
                'Polite Driver 🛵',
                'Accurate Order ✅',
                'Generous Portion 🍱'
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                    feedbackComment.includes(tag)
                      ? 'bg-orange-500 text-white border-orange-500 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Review / Comments (Optional):
            </label>
            <TextArea
              rows={3}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Tell us what you liked or what could be improved about the taste, temperature, packaging, or delivery..."
              className="text-xs rounded-xl p-3 border-slate-200 focus:border-[#FF521C]"
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
