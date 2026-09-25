import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from '../../api/axios';
import { notification, Switch } from 'antd';
import { 
  ShopOutlined, 
  EnvironmentOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  CarOutlined,
  ArrowRightOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  StarFilled,
  StarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  CompassOutlined,
  CustomerServiceOutlined,
  ShoppingOutlined,
  WalletOutlined,
  BulbOutlined,
  AppstoreOutlined,
  DownOutlined,
  CheckOutlined
} from '@ant-design/icons';
import socket from '../../socket';
import AppMap from '../../pages/Map/Map';
import { updateProfile } from '../../redux/slices/authSlice';

// Clean SVG Icons for categories (No Emojis!)
const BurgerIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 10a6 6 0 0 1 12 0v1H6v-1z" />
    <path d="M4 14h16" />
    <path d="M5 18h14a2 2 0 0 1 0 4H5a2 2 0 0 1 0-4z" />
  </svg>
);

const BowlIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11a8 8 0 0 0 16 0H4z" />
    <path d="M6 19h12" />
    <path d="M9 5c0 1.5-1 2-1 3.5" />
    <path d="M12 4c0 1.5-1 2-1 3.5" />
    <path d="M15 5c0 1.5-1 2-1 3.5" />
  </svg>
);

const PizzaIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 20a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1L12 2z" />
    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M15 16m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
  </svg>
);

const DrinkIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8h14l-1.5 12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 8z" />
    <path d="M4 4h16v4H4z" />
    <path d="M10 2v2" />
  </svg>
);

// Helper to render restaurant logos accurately
function RestaurantBrandLogo({ name }) {
  const n = (name || '').toLowerCase();

  if (n.includes('mcdonald') || n.includes('mc donald')) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#DA291C] flex items-center justify-center font-black text-white text-3xl shadow-sm border border-red-400/30 shrink-0">
        <span className="text-[#FFC72C] select-none font-serif tracking-tighter">M</span>
      </div>
    );
  }
  if (n.includes('kfc')) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#E4002B] flex items-center justify-center font-black text-white text-xl shadow-sm border border-red-500/30 shrink-0">
        <span className="tracking-tighter select-none font-sans">KFC</span>
      </div>
    );
  }
  if (n.includes('domino')) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#006491] flex flex-col items-center justify-center shadow-sm border border-blue-400/30 shrink-0 p-1">
        <div className="rotate-45 w-5 h-5 bg-red-600 rounded-sm flex items-center justify-center shadow-2xs">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
        <span className="text-[7px] font-black text-white mt-1 tracking-tight uppercase">Domino's</span>
      </div>
    );
  }
  if (n.includes('behrouz')) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-amber-500/40 flex flex-col items-center justify-center font-bold text-amber-400 text-[10px] text-center p-1 leading-tight shadow-sm shrink-0">
        <span className="text-xs">👑</span>
        <span className="tracking-tighter">BEHROUZ</span>
      </div>
    );
  }
  if (n.includes('burger')) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-2xl shadow-sm shrink-0">
        <BurgerIcon />
      </div>
    );
  }

  // Fallback initial badge
  return (
    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF521C] to-amber-600 flex items-center justify-center font-extrabold text-white text-xl shadow-sm shrink-0">
      {(name || 'R').charAt(0).toUpperCase()}
    </div>
  );
}

// Real-time Accept/Reject Toast for incoming delivery offers
function DeliveryOfferToast({ offer, onAccept, onReject, onDismiss }) {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) { onDismiss(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onDismiss]);

  const restName = offer.restaurant?.name || offer.Restaurant?.name || 'Restaurant';
  const dropAddress = offer.deliveryAddress?.address_line1 || offer.address?.street || offer.Address?.street || 'Customer location';
  const payout = Math.round(parseFloat(offer.delivery_fee || 150));

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-84 bg-white rounded-2xl shadow-2xl border-2 border-[#FF521C] p-4 animate-slide-up">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF521C] flex items-center justify-center text-lg font-bold">
            <CarOutlined />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 leading-tight">New Delivery Offer!</p>
            <p className="text-[10px] text-slate-500 font-medium">Expires in {countdown}s</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 text-xs p-1">
          <CloseOutlined />
        </button>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-1.5 text-xs border border-slate-100">
        <div className="flex items-center gap-2">
          <ShopOutlined className="text-[#FF521C] text-xs shrink-0" />
          <span className="font-bold text-slate-900">{restName}</span>
        </div>
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-emerald-500 text-xs shrink-0" />
          <span className="text-slate-600 truncate">{dropAddress}</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
          <DollarOutlined className="text-[#FF521C] text-xs shrink-0" />
          <span className="text-[11px] text-slate-500 font-semibold">Payout:</span>
          <span className="font-black text-[#FF521C] text-sm">₹{payout.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onReject}
          className="flex-1 py-2 rounded-xl border border-[#FF521C]/40 text-[#FF521C] text-xs font-bold hover:bg-orange-50 transition-colors"
        >
          Reject
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2 rounded-xl bg-[#FF521C] hover:bg-[#E04310] text-white text-xs font-bold transition-colors shadow-md shadow-orange-500/20"
        >
          Accept Order
        </button>
      </div>

      {/* Countdown progress bar */}
      <div className="mt-2.5 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FF521C] rounded-full transition-all duration-1000"
          style={{ width: `${(countdown / 30) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function DeliveryOrders() {
  const dispatch = useDispatch();
  const { profile, token } = useSelector(state => state.auth);
  
  const [availableRequests, setAvailableRequests] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingOffer, setPendingOffer] = useState(null);

  // Rejected order IDs storage so rejected orders remain removed
  const [rejectedOrderIds, setRejectedOrderIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rejected_orders') || '[]');
    } catch (e) {
      return [];
    }
  });

  // GPS Location & Center state
  const [driverCoords, setDriverCoords] = useState(null);
  const [locationName, setLocationName] = useState('Salt Lake, Kolkata');
  const [locating, setLocating] = useState(false);

  // Filter Category Controls
  const [activeTab, setActiveTab] = useState('All');

  const isOnline = Boolean(profile?.is_available);

  // Detect Driver's Live GPS Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      notification.error({ 
        title: 'Geolocation Error', 
        message: 'Geolocation Error', 
        description: 'Geolocation is not supported by your browser.' 
      });
      return;
    }

    setLocating(true);
    notification.info({ 
      title: 'Detecting Location', 
      message: 'Detecting Location', 
      description: 'Acquiring GPS position...' 
    });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDriverCoords({ lat, lng });

        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const addr = res.data?.address;
          const city = addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.city || 'Local Area';
          const state = addr?.state || 'Kolkata';
          setLocationName(`${city}, ${state}`);
        } catch (e) {
          setLocationName(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
        } finally {
          setLocating(false);
          notification.success({ 
            title: 'Location Updated!', 
            description: 'Map centered to your current GPS position.' 
          });
        }
      },
      (_err) => {
        setLocating(false);
        notification.warning({ 
          title: 'GPS Warning', 
          description: 'Unable to get precise GPS. Defaulted to Salt Lake, Kolkata.' 
        });
        setDriverCoords({ lat: 22.5726, lng: 88.4337 });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const [availableRes, activeRes] = await Promise.all([
        axios.get('/orders/deliveries/available'),
        axios.get('/orders/driver/me')
      ]);
      
      if (availableRes.data.success) {
        setAvailableRequests(availableRes.data.data || []);
      }
      if (activeRes.data.success) {
        const d = activeRes.data.data;
        const activeObj = Array.isArray(d) ? d[0] : (d || activeRes.data.active || null);
        setActiveDelivery(activeObj || null);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      // Ensure profile is loaded
      if (!profile?.id) {
        axios.get('/delivery-partners/my-profile')
          .then(res => {
            if (res.data?.success && res.data.data) {
              dispatch(updateProfile(res.data.data));
            }
          })
          .catch(() => {});
      }

      fetchDeliveries();

      socket.connect();
      socket.emit('join_deliveries');

      const handleAvailableDelivery = (data) => {
        const oId = data.id || data.orderId;
        if (rejectedOrderIds.includes(oId)) return;
        setPendingOffer(data);
        fetchDeliveries();
      };

      const handleReadyForPickup = (data) => {
        const oId = data.id || data.orderId;
        if (rejectedOrderIds.includes(oId)) return;
        setPendingOffer(data);
        fetchDeliveries();
      };

      const handleOrderAccepted = (data) => {
        setAvailableRequests(prev => prev.filter(r => r.id !== data.orderId));
        setPendingOffer(prev => (prev?.id === data.orderId || prev?.orderId === data.orderId ? null : prev));
      };

      const handleDriverAssigned = () => {
        fetchDeliveries();
      };

      const handleOrderStatusUpdated = () => {
        fetchDeliveries();
      };

      socket.on('AVAILABLE_DELIVERY', handleAvailableDelivery);
      socket.on('ORDER_READY_FOR_PICKUP', handleReadyForPickup);
      socket.on('ORDER_ACCEPTED', handleOrderAccepted);
      socket.on('DRIVER_ASSIGNED', handleDriverAssigned);
      socket.on('ORDER_STATUS_UPDATED', handleOrderStatusUpdated);

      return () => {
        socket.off('AVAILABLE_DELIVERY', handleAvailableDelivery);
        socket.off('ORDER_READY_FOR_PICKUP', handleReadyForPickup);
        socket.off('ORDER_ACCEPTED', handleOrderAccepted);
        socket.off('DRIVER_ASSIGNED', handleDriverAssigned);
        socket.off('ORDER_STATUS_UPDATED', handleOrderStatusUpdated);
      };
    } else {
      setLoading(false);
    }
  }, [profile?.id, token, isOnline, rejectedOrderIds, dispatch]);

  const acceptRequest = async (orderId) => {
    try {
      const { data } = await axios.put(`/orders/${orderId}/accept-delivery`);
      if (data.success) {
        notification.success({ 
          title: 'Delivery Accepted!', 
          description: 'Drive safely to the restaurant for pickup.' 
        });
        setPendingOffer(null);
        fetchDeliveries();
      }
    } catch (error) {
      notification.error({ 
        title: 'Error', 
        description: error.response?.data?.message || 'Error accepting delivery' 
      });
      console.error('Error accepting delivery:', error);
    }
  };

  // Permanently hide / remove rejected order for this driver
  const rejectRequest = (orderId) => {
    if (!orderId) return;

    setRejectedOrderIds(prev => {
      const updated = [...prev, orderId];
      try {
        localStorage.setItem('rejected_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setAvailableRequests(prev => prev.filter(r => r.id !== orderId));
    setPendingOffer(prev => (prev?.id === orderId || prev?.orderId === orderId ? null : prev));

    notification.info({ 
      title: 'Delivery Rejected', 
      description: 'The offer has been removed from your available requests.' 
    });
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      if (activeDelivery && (activeDelivery.id === orderId || activeDelivery.orderId === orderId)) {
        setActiveDelivery(prev => prev ? { ...prev, status: newStatus } : prev);
      }
      const { data } = await axios.put(`/orders/${orderId}/status`, { status: newStatus });
      if (data.success) {
        notification.success({ 
          title: 'Status Updated!', 
          description: `Order marked as ${newStatus}!` 
        });
        fetchDeliveries();
      }
    } catch (error) {
      fetchDeliveries();
      notification.error({ 
        title: 'Update Failed', 
        description: 'Error updating delivery status' 
      });
      console.error('Error updating status:', error);
    }
  };

  // Helper metadata calculation for each order item
  const getOrderMetadata = (req, index) => {
    const restName = req.restaurant?.name || req.Restaurant?.name || 'Restaurant';
    const cuisine = req.restaurant?.cuisine_type || (
      restName.toLowerCase().includes('burger') ? 'Burgers • Fast Food' :
      restName.toLowerCase().includes('biryani') ? 'Biryani • Mughlai' :
      restName.toLowerCase().includes('domino') || restName.toLowerCase().includes('pizza') ? 'Pizza • Italian' :
      restName.toLowerCase().includes('kfc') ? 'Chicken • Fast Food' : 'Multi-cuisine • Fast Food'
    );
    
    // Distances
    const pickupKm = (1.5 + (index * 0.6) % 2.5).toFixed(1);
    const dropoffKm = (3.2 + (index * 1.1) % 4.0).toFixed(1);
    const totalKm = (parseFloat(pickupKm) + parseFloat(dropoffKm)).toFixed(1);
    const estMins = Math.round(parseFloat(totalKm) * 2.8 + 8);
    
    // Payout
    const payout = Math.round(parseFloat(req.delivery_fee || 150));
    
    // Locations
    const pickupLoc = req.restaurant?.address?.split(',')[0] || req.Restaurant?.location || 'Sector V, Salt Lake';
    const dropoffLoc = req.deliveryAddress?.address_line1 || req.Address?.street || 'New Town, Kolkata';
    
    // Items count
    const itemsCount = req.items?.length || (index % 3) + 2;
    
    // Payment Type
    const isCOD = req.payment_method === 'cod';

    return {
      restName,
      cuisine,
      pickupKm,
      dropoffKm,
      totalKm,
      estMins,
      payout,
      pickupLoc,
      dropoffLoc,
      itemsCount,
      isCOD
    };
  };

  // Filtering Logic (Excludes rejected orders!)
  const filteredOrders = availableRequests.filter(req => {
    if (rejectedOrderIds.includes(req.id)) return false;

    if (activeTab === 'All') return true;
    const restName = (req.restaurant?.name || req.Restaurant?.name || '').toLowerCase();

    if (activeTab === 'Burgers') return restName.includes('burger') || restName.includes('mcdonald');
    if (activeTab === 'Biryani') return restName.includes('biryani') || restName.includes('behrouz');
    if (activeTab === 'Pizza') return restName.includes('pizza') || restName.includes('domino');
    if (activeTab === 'Drinks') return restName.includes('drink') || restName.includes('cafe');
    if (activeTab === 'High Payout') {
      const payout = parseFloat(req.delivery_fee || 150);
      return payout >= 150;
    }
    if (activeTab === 'Nearby') return true;
    return true;
  });

  // Sort orders so NEWEST orders are listed FIRST (default!)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
  });

  if (loading && availableRequests.length === 0 && !activeDelivery) {
    return (
      <div className="py-24 text-center flex flex-col items-center">
        <ReloadOutlined spin className="text-3xl text-[#FF521C] mb-3" />
        <p className="text-slate-500 font-bold text-sm">Searching nearby delivery requests...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-5 text-slate-800 pb-12">
      {/* Real-time Accept/Reject Toast */}
      {pendingOffer && (
        <DeliveryOfferToast
          offer={pendingOffer}
          onAccept={() => acceptRequest(pendingOffer.id || pendingOffer.orderId)}
          onReject={() => rejectRequest(pendingOffer.id || pendingOffer.orderId)}
          onDismiss={() => setPendingOffer(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            Available Deliveries
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Accept orders nearby and start earning. Choose the best orders for you.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Location Selector Pill */}
          <button 
            onClick={handleDetectLocation}
            disabled={locating}
            title="Click to detect & update your current location"
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-2xl text-xs font-bold text-slate-800 shadow-2xs transition-all active:scale-98 cursor-pointer"
          >
            <EnvironmentOutlined className={`text-[#FF521C] text-sm ${locating ? 'animate-bounce' : ''}`} />
            <span>{locationName}</span>
            <DownOutlined className="text-slate-400 text-[10px] ml-1" />
          </button>

          {/* Refresh Button */}
          <button 
            onClick={fetchDeliveries} 
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-2xl text-xs font-bold text-slate-800 shadow-2xs transition-all cursor-pointer"
          >
            <ReloadOutlined className={`text-xs text-slate-600 ${loading ? 'animate-spin' : ''}`} /> 
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Active Delivery View (if driver is currently delivering an order) */}
      {activeDelivery && (
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 p-5 rounded-2xl border-2 border-orange-400/80 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-orange-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FF521C] text-white flex items-center justify-center text-lg font-bold">
                <CarOutlined />
              </div>
              <div>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider block">ONGOING ACTIVE TASK</span>
                <h3 className="text-base font-black text-slate-900">
                  Order #{activeDelivery.id.slice(0, 8).toUpperCase()}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold bg-white text-orange-600 px-3 py-1 rounded-full border border-orange-200 shadow-2xs uppercase">
                Status: {activeDelivery.status.replace(/_/g, ' ')}
              </span>
              {activeDelivery.status === 'assigned' && (
                <button 
                  onClick={() => updateStatus(activeDelivery.id, 'arrived')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <EnvironmentOutlined /> Arrived at Restaurant
                </button>
              )}
              {(activeDelivery.status === 'arrived' || activeDelivery.status === 'ready') && (
                <button 
                  onClick={() => updateStatus(activeDelivery.id, 'picked_up')}
                  className="bg-[#FF521C] hover:bg-[#E04310] text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingOutlined /> Mark as Picked Up ✓
                </button>
              )}
              {(activeDelivery.status === 'picked_up' || activeDelivery.status === 'picking_up') && (
                <button 
                  onClick={() => updateStatus(activeDelivery.id, 'out_for_delivery')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CarOutlined /> Start Delivery (Out for Delivery) 🛵
                </button>
              )}
              {(activeDelivery.status === 'out_for_delivery' || activeDelivery.status === 'in_transit') && (
                <button 
                  onClick={() => updateStatus(activeDelivery.id, 'delivered')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircleOutlined /> Mark as Delivered ✓
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider block">1. PICKUP RESTAURANT</span>
              <p className="font-black text-slate-900 text-sm">{activeDelivery.restaurant?.name || activeDelivery.Restaurant?.name || 'Restaurant'}</p>
              <p className="text-xs text-slate-600">📍 {activeDelivery.restaurant?.address || activeDelivery.restaurant?.location || activeDelivery.Restaurant?.location || 'Sector V, Salt Lake'}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">2. DROPOFF CUSTOMER</span>
              <p className="font-black text-slate-900 text-sm">{activeDelivery.customer?.user?.full_name || activeDelivery.Customer?.User?.full_name || 'Customer'}</p>
              <p className="text-xs text-slate-600">📍 {activeDelivery.deliveryAddress?.address_line1 || activeDelivery.Address?.street || 'Customer Address'}</p>
              <p className="text-xs font-bold text-emerald-700 pt-1 flex items-center gap-1">
                <PhoneOutlined /> {activeDelivery.customer?.user?.phone_number || activeDelivery.Customer?.User?.phone_number || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Category Tabs Row (Matching Screenshot UI) */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'All', label: `All (${sortedOrders.length})`, icon: <AppstoreOutlined /> },
          { id: 'Nearby', label: 'Nearby', icon: <EnvironmentOutlined /> },
          { id: 'High Payout', label: 'High Payout', icon: <StarOutlined /> },
          { id: 'Burgers', label: 'Burgers', icon: <BurgerIcon /> },
          { id: 'Biryani', label: 'Biryani', icon: <BowlIcon /> },
          { id: 'Pizza', label: 'Pizza', icon: <PizzaIcon /> },
          { id: 'Drinks', label: 'Drinks', icon: <DrinkIcon /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#FF521C] border-[#FF521C] text-white shadow-md shadow-orange-500/20'
                : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Delivery Cards List (8 of 12 cols) - NEWEST FIRST */}
        <div className="lg:col-span-8 space-y-4">
          {sortedOrders.length > 0 ? (
            sortedOrders.map((req, idx) => {
              const meta = getOrderMetadata(req, idx);

              return (
                <div 
                  key={req.id} 
                  className="bg-white border border-slate-200/90 hover:border-orange-300 rounded-2xl p-5 transition-all shadow-2xs hover:shadow-md space-y-4 group"
                >
                  {/* Top Header & Pickup / Dropoff Details */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    {/* Restaurant Logo & Name */}
                    <div className="flex items-start gap-3.5 min-w-[200px]">
                      <RestaurantBrandLogo name={meta.restName} />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#FF521C] transition-colors">
                          {meta.restName}
                        </h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                          {meta.cuisine}
                        </p>
                      </div>
                    </div>

                    {/* Pickup & Dropoff Columns */}
                    <div className="grid grid-cols-2 gap-4 flex-1 w-full sm:w-auto">
                      {/* Pickup Column */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-50 text-[#FF521C] flex items-center justify-center text-xs shrink-0 mt-0.5 border border-orange-100">
                          <ShopOutlined />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pickup</span>
                          <p className="font-extrabold text-slate-900 text-sm leading-tight">{meta.pickupKm} km</p>
                          <p className="text-xs text-slate-500 truncate max-w-[140px]">{meta.pickupLoc}</p>
                        </div>
                      </div>

                      {/* Dropoff Column */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-orange-50 text-[#FF521C] flex items-center justify-center text-xs shrink-0 mt-0.5 border border-orange-100">
                          <EnvironmentOutlined />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dropoff</span>
                          <p className="font-extrabold text-slate-900 text-sm leading-tight">{meta.dropoffKm} km</p>
                          <p className="text-xs text-slate-500 truncate max-w-[140px]">{meta.dropoffLoc}</p>
                        </div>
                      </div>
                    </div>

                    {/* Estimated Payout & Time (Top Right) */}
                    <div className="text-right shrink-0 self-end sm:self-start">
                      <span className="text-[11px] font-medium text-slate-400 block">Estimated Payout</span>
                      <div className="text-2xl font-black text-[#FF521C] leading-tight">
                        ₹{meta.payout}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-xs text-slate-500 font-semibold mt-1">
                        <ClockCircleOutlined className="text-slate-400 text-xs" />
                        <span>Est. Time</span>
                        <span className="font-bold text-slate-700">{meta.estMins} mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Row & Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      {meta.isCOD ? (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200/80 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <CheckOutlined className="text-xs" /> Cash on Delivery
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-600 border border-blue-200/80 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                          <CheckCircleOutlined className="text-xs" /> Prepaid Order
                        </span>
                      )}

                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                        <ShoppingOutlined className="text-xs text-slate-400" /> Items: {meta.itemsCount}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        onClick={() => rejectRequest(req.id)}
                        className="flex-1 sm:flex-none border border-[#FF521C]/40 text-[#FF521C] hover:bg-orange-50 px-6 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>

                      <button 
                        onClick={() => acceptRequest(req.id)}
                        className="flex-1 sm:flex-none bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white px-7 py-2 rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                      >
                        Accept Order
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center text-center">
              <img
                src="/empty-clipboard.jpg"
                alt="No available orders"
                className="w-20 h-20 object-contain mb-3 filter drop-shadow-2xs opacity-80"
              />
              <h4 className="text-slate-900 font-extrabold text-sm mb-1">
                No available delivery requests nearby
              </h4>
              <p className="text-slate-400 text-xs max-w-sm">
                New customer orders will automatically appear here in real time. Make sure your status is set to Online.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Driver Sidebar (4 of 12 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Your Current Location / Map Widget */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Your Current Location</h3>

            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <AppMap 
                centerLat={driverCoords?.lat} 
                centerLng={driverCoords?.lng} 
                hideControls={true} 
              />

              {/* Top Left Floating Map Badge (Positioned at left-14 to prevent zoom button overlap) */}
              <div className="absolute top-3 left-14 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 pointer-events-none">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <div>
                  <p className="text-[11px] font-black text-slate-900 leading-tight">
                    {isOnline ? 'You are online' : 'You are offline'}
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium">Orders around you</p>
                </div>
              </div>

              {/* Top Right Target GPS Button */}
              <button 
                onClick={handleDetectLocation}
                title="Detect & Center My GPS Location"
                className="absolute top-3 right-3 z-[400] w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-[#FF521C] hover:bg-orange-50 transition-all text-sm cursor-pointer"
              >
                <CompassOutlined className={locating ? 'animate-spin text-[#FF521C]' : ''} />
              </button>
            </div>
          </div>

          {/* Card 2: Today's Stats Grid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-sm">Today's Stats</h3>
              <button className="text-[11px] font-bold text-[#FF521C] hover:underline flex items-center gap-0.5 cursor-pointer">
                View All →
              </button>
            </div>

            {/* 4 Metric Tiles matching screenshot */}
            <div className="grid grid-cols-2 gap-3">
              {/* Deliveries Tile */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm mb-2">
                  <ShoppingOutlined />
                </div>
                <div className="text-xl font-black text-slate-900">12</div>
                <div className="text-[11px] font-semibold text-slate-400">Deliveries</div>
              </div>

              {/* Earnings Tile */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-sm mb-2">
                  <WalletOutlined />
                </div>
                <div className="text-xl font-black text-slate-900">₹1,840</div>
                <div className="text-[11px] font-semibold text-slate-400">Earnings</div>
              </div>

              {/* Online Time Tile */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm mb-2">
                  <ClockCircleOutlined />
                </div>
                <div className="text-xl font-black text-slate-900">6.5 hrs</div>
                <div className="text-[11px] font-semibold text-slate-400">Online Time</div>
              </div>

              {/* Rating Tile */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center text-sm mb-2">
                  <StarFilled />
                </div>
                <div className="text-xl font-black text-slate-900">4.8</div>
                <div className="text-[11px] font-semibold text-slate-400">Rating</div>
              </div>
            </div>
          </div>

          {/* Card 3: Quick Tips */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <BulbOutlined className="text-amber-500 text-base" /> Quick Tips
            </h3>

            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-[#FF521C] font-bold">•</span>
                <span>Accept orders that are near you.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF521C] font-bold">•</span>
                <span>Keep your app online to get more orders.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF521C] font-bold">•</span>
                <span>Complete deliveries on time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF521C] font-bold">•</span>
                <span>Maintain a good rating.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF521C] font-bold">•</span>
                <span>Check order details before accepting.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
