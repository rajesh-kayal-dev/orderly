import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { clearCartAsync, fetchCart } from '../../redux/slices/cartSlice';
import EmptyState from '../../components/common/EmptyState';
import OrderSuccessModal from '../../components/common/OrderSuccessModal';
import { notification, Modal } from 'antd';
import {
  ShoppingCartOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  MessageOutlined,
  LockOutlined,
  CheckCircleFilled,
  EditOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  HeartOutlined,
  LoadingOutlined,
  CompassOutlined,
  TagOutlined
} from '@ant-design/icons';

// Banner image referenced directly from public folder
const BANNER_IMAGE = '/food_banners/Dark Wooden Board Spoon Chili Banner, Dark Wooden Board, Spoon, Pepper Background Image And Wallpaper for Free Download.jpg';

// Steps for the checkout stepper
const STEPS = [
  { num: 1, label: 'Delivery' },
  { num: 2, label: 'Payment' },
  { num: 3, label: 'Review' },
  { num: 4, label: 'Complete' }
];

export default function CheckoutPage() {
  const { items, total } = useSelector(state => state.cart);
  const { user, profile } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [successOrder, setSuccessOrder] = useState(null);

  // Read applied coupon from sessionStorage
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = sessionStorage.getItem('orderly_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Razorpay SDK load ref
  const razorpayLoaded = useRef(false);

  // Dynamic Price Calculations (Matching CartPage Parity)
  const subtotal = total || items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  let discountAmount = 0;
  if (appliedCoupon && items.length > 0 && subtotal > 0) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && discountAmount > appliedCoupon.maxDiscount) {
        discountAmount = appliedCoupon.maxDiscount;
      }
    } else if (appliedCoupon.type === 'flat') {
      discountAmount = appliedCoupon.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
  }

  const deliveryFee = items.length > 0 ? 30.00 : 0.00;
  const platformFee = items.length > 0 ? 5.00 : 0.00;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gst = taxableAmount * 0.05;
  const grandTotal = items.length > 0 ? Math.max(0, taxableAmount + deliveryFee + platformFee + gst) : 0.00;

  // Load Razorpay checkout SDK
  useEffect(() => {
    if (razorpayLoaded.current) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => { razorpayLoaded.current = true; };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // Populate address and contact from profile
  useEffect(() => {
    const defaultAddress = profile?.Addresses?.find(a => a.is_default === true)
      || profile?.addresses?.find(a => a.is_default === true);

    if (defaultAddress) {
      const parts = [
        defaultAddress.address_line1,
        defaultAddress.address_line2,
        defaultAddress.city,
        defaultAddress.state,
        defaultAddress.postal_code
      ].filter(Boolean);
      setAddress(parts.join(', ') || defaultAddress.street || '');
      setSelectedAddressId(defaultAddress.id || '');
    } else if (profile?.Addresses?.[0]) {
      const addr = profile.Addresses[0];
      setAddress(addr.street || addr.address_line1 || '');
      setSelectedAddressId(addr.id || '');
    } else {
      setAddress('Default Delivery Location, Main Street');
      setSelectedAddressId('default-loc-id');
    }

    setPhone(user?.phone_number || profile?.phone_number || '');
    setEmail(user?.email || '');
  }, [profile, user]);

  // Real Working Geolocation Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      notification.error({
        message: 'Geolocation Error',
        description: 'Geolocation is not supported by your browser.',
        placement: 'topRight'
      });
      return;
    }

    setLocating(true);
    notification.info({
      message: 'Detecting Location...',
      description: 'Fetching your precise GPS coordinates.',
      placement: 'topRight',
      duration: 2
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse Geocoding via OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          let formattedAddress = '';
          if (data && data.address) {
            const a = data.address;
            const road = a.road || a.pedestrian || a.suburb || a.neighbourhood || '';
            const city = a.city || a.town || a.village || a.county || '';
            const state = a.state || '';
            const postcode = a.postcode || '';
            formattedAddress = [road, city, state, postcode].filter(Boolean).join(', ');
          }

          if (!formattedAddress) {
            formattedAddress = data?.display_name || `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
          }

          setAddress(formattedAddress);
          setSelectedAddressId(`gps-${Date.now()}`);

          notification.success({
            message: 'Location Updated!',
            description: `Set address to: ${formattedAddress}`,
            placement: 'topRight'
          });
        } catch (err) {
          const fallback = `Current GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setAddress(fallback);
          setSelectedAddressId(`gps-${Date.now()}`);
          notification.success({
            message: 'GPS Location Detected',
            description: fallback,
            placement: 'topRight'
          });
        } finally {
          setLocating(false);
        }
      },
      (geoErr) => {
        setLocating(false);
        notification.error({
          message: 'Location Error',
          description: geoErr.message || 'Unable to access your location. Please check browser permissions.',
          placement: 'topRight'
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePlaceOrder = async () => {
    if (!address.trim() || !phone.trim()) {
      notification.warning({
        message: 'Incomplete Information',
        description: 'Please ensure your delivery address and phone number are filled.',
        placement: 'topRight'
      });
      return;
    }

    try {
      setLoading(true);

      if (paymentMethod === 'razorpay') {
        await handleRazorpayFlow();
      } else {
        await handleCODFlow();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      if (error.response?.data?.type === 'AVAILABILITY_CONFLICT') {
        const unavailableItems = error.response.data.unavailableItems || [];
        Modal.confirm({
          title: 'Some items are unavailable',
          content: (
            <div>
              <p>The following items are no longer available:</p>
              <ul className="list-disc ml-5 text-red-500 font-medium my-2">
                {unavailableItems.map(item => <li key={item.id}>{item.name}</li>)}
              </ul>
              <p className="mt-2 text-xs text-neutral-500">Proceed with the remaining available items?</p>
            </div>
          ),
          okText: 'Yes, Proceed',
          cancelText: 'Cancel',
          onOk: () => { dispatch(fetchCart()); handlePlaceOrder(); }
        });
      } else {
        notification.error({
          message: 'Checkout Error',
          description: error.response?.data?.message || 'Something went wrong. Please try again.',
          placement: 'topRight'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCODFlow = async () => {
    const cartSnapshotItems = items.map(i => ({
      menuItem: { name: i.name, image_url: i.image },
      quantity: i.quantity,
      unit_price: i.price
    }));

    const orderData = {
      delivery_address_id: selectedAddressId || 'default-loc-id',
      payment_method: 'cod',
      notes: notes || 'No notes provided',
      items: items.map(i => ({ menu_item_id: i.id, quantity: i.quantity, price: i.price, restaurant_id: i.restaurant_id || 1 }))
    };
    const response = await axios.post('/orders', orderData);
    if (response.data.success) {
      const createdOrder = response.data.data;
      createdOrder.items = (createdOrder.items && createdOrder.items.length > 0)
        ? createdOrder.items
        : (createdOrder.OrderItems && createdOrder.OrderItems.length > 0)
          ? createdOrder.OrderItems
          : cartSnapshotItems;
      createdOrder.appliedCoupon = appliedCoupon;
      createdOrder.subtotal = subtotal;
      createdOrder.discountAmount = discountAmount;
      createdOrder.deliveryFee = deliveryFee;
      createdOrder.platformFee = platformFee;
      createdOrder.gst = gst;
      createdOrder.grandTotal = grandTotal;

      setSuccessOrder(createdOrder);
      sessionStorage.removeItem('orderly_applied_coupon');
      await dispatch(clearCartAsync());
    }
  };

  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayFlow = async () => {
    const cartSnapshotItems = items.map(i => ({
      menuItem: { name: i.name, image_url: i.image },
      quantity: i.quantity,
      unit_price: i.price
    }));

    const loaded = await loadRazorpaySDK();
    if (!loaded || !window.Razorpay) {
      notification.error({ message: 'Payment SDK not loaded', description: 'Please check internet connection and try again.' });
      return;
    }

    const orderData = {
      delivery_address_id: selectedAddressId || 'default-loc-id',
      delivery_address: address,
      phone_number: phone,
      payment_method: 'online',
      notes: notes || 'No notes provided',
      items: items.map(i => ({ menu_item_id: i.id, quantity: i.quantity, price: i.price, restaurant_id: i.restaurant_id || 1 }))
    };
    const orderRes = await axios.post('/orders', orderData);
    if (!orderRes.data.success) throw new Error('Failed to create order');
    const createdOrder = orderRes.data.data;

    const paymentRes = await axios.post('/payments/create-order', {
      orderId: createdOrder.id
    });
    if (!paymentRes.data.success) throw new Error('Failed to initiate payment');

    const { razorpayOrderId, amount, currency, keyId } = paymentRes.data.data;

    await new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Orderly',
        description: `Order #ORD${createdOrder.id.slice(0, 8).toUpperCase()}`,
        image: '/logo.svg',
        order_id: razorpayOrderId,
        prefill: {
          name: user?.full_name || 'Customer',
          email: email,
          contact: phone
        },
        theme: {
          color: '#F97316'
        },
        modal: {
          ondismiss: () => {
            notification.warning({
              message: 'Payment Cancelled',
              description: 'You cancelled the payment. Your order has been placed but is pending payment.',
              placement: 'topRight'
            });
            reject(new Error('Payment modal dismissed'));
          }
        },
        handler: async (response) => {
          try {
            const verifyRes = await axios.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: createdOrder.id
            });

            if (verifyRes.data.success && verifyRes.data.data.verified) {
              let fullOrder = createdOrder;
              try {
                const orderDetailRes = await axios.get(`/orders/${createdOrder.id}`);
                if (orderDetailRes.data.success) fullOrder = orderDetailRes.data.data;
              } catch { /* use original order data */ }

              fullOrder.items = (fullOrder.items && fullOrder.items.length > 0)
                ? fullOrder.items
                : (fullOrder.OrderItems && fullOrder.OrderItems.length > 0)
                  ? fullOrder.OrderItems
                  : cartSnapshotItems;

              fullOrder.appliedCoupon = appliedCoupon;
              fullOrder.subtotal = subtotal;
              fullOrder.discountAmount = discountAmount;
              fullOrder.deliveryFee = deliveryFee;
              fullOrder.platformFee = platformFee;
              fullOrder.gst = gst;
              fullOrder.grandTotal = grandTotal;

              setSuccessOrder(fullOrder);
              sessionStorage.removeItem('orderly_applied_coupon');
              await dispatch(clearCartAsync());
              resolve();
            } else {
              reject(new Error('Payment verification failed'));
            }
          } catch (verifyError) {
            reject(verifyError);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        notification.error({
          message: 'Payment Failed',
          description: response.error?.description || 'Your payment could not be processed.',
          placement: 'topRight'
        });
        reject(new Error(response.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
  };

  if (successOrder) {
    return (
      <OrderSuccessModal
        order={successOrder}
        onClose={() => {
          setSuccessOrder(null);
          navigate('/customer/tracking');
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 max-w-xl mx-auto animate-fade-in">
        <EmptyState
          icon={<ShoppingCartOutlined className="text-orange-500" />}
          title="Your Cart is Empty"
          description="You cannot checkout with an empty cart. Please add items from a restaurant menu."
          actionText="Explore Restaurants"
          onAction={() => navigate('/customer/restaurants')}
        />
      </div>
    );
  }

  return (
    <>
      {/* Order Success Modal */}
      {successOrder && (
        <OrderSuccessModal
          order={successOrder}
          onClose={() => {
            setSuccessOrder(null);
            navigate('/customer/tracking');
          }}
        />
      )}

      <div className="pb-16 animate-fade-in -mt-16 bg-neutral-50/60 min-h-screen">

        {/* ── FULL-BLEED HERO BANNER ── */}
        <div className="relative bg-neutral-900 text-white pt-20 pb-14 border-b border-neutral-800 overflow-hidden">
          <img
            src={BANNER_IMAGE}
            alt="Checkout Banner"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-900/60 to-neutral-950/20" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Secure checkout badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border"
              style={{ background: 'rgba(249,115,22,0.2)', borderColor: 'rgba(249,115,22,0.4)', color: '#FDBA74' }}
            >
              🔒 Secure Checkout
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Checkout</h1>
                <p className="text-neutral-300 mt-2 text-sm md:text-base">Just a few more steps to enjoy your favorite food!</p>
              </div>

              {/* Quote card */}
              <div className="hidden lg:block bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 max-w-xs shadow-xl text-right">
                <p className="text-xs font-serif italic text-amber-300 leading-snug">
                  "Good food is a good mood."
                </p>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">— UNKNOWN</p>
              </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-0 mt-8 max-w-md">
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.num}>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all"
                      style={step.num === 1
                        ? { background: '#F97316', borderColor: '#F97316', color: 'white' }
                        : { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)' }
                      }
                    >
                      {step.num === 1 ? <CheckCircleFilled /> : step.num}
                    </div>
                    <span className="text-[10px] font-bold whitespace-nowrap"
                      style={{ color: step.num === 1 ? '#FDBA74' : 'rgba(255,255,255,0.5)' }}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="h-0.5 flex-1 mx-1 mb-4"
                      style={{ background: 'rgba(255,255,255,0.2)' }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── LEFT: Delivery + Contact + Payment ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Delivery Address */}
              <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-orange-600"
                      style={{ background: '#FFF7F0' }}>
                      <EnvironmentOutlined className="text-lg" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-neutral-900">Delivery Address</h3>
                      <span className="text-xs text-neutral-400 font-medium">Where should we deliver your order?</span>
                    </div>
                  </div>

                  {/* Real Working Geolocation Location Button */}
                  <button
                    disabled={locating}
                    onClick={handleUseCurrentLocation}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all hover:bg-orange-50 hover:border-orange-400 cursor-pointer shadow-2xs"
                    style={{ color: '#F97316', borderColor: '#FDBA74' }}
                  >
                    {locating ? (
                      <>
                        <LoadingOutlined className="animate-spin text-xs" />
                        <span>Detecting location...</span>
                      </>
                    ) : (
                      <>
                        <CompassOutlined />
                        <span>Use Current Location</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Delivery Address (Editable)
                    </label>
                    <span className="text-[11px] text-orange-600 font-bold flex items-center gap-1">
                      <EditOutlined /> Edit details anytime
                    </span>
                  </div>

                  {/* Directly Editable Address Field */}
                  <textarea
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (!selectedAddressId) setSelectedAddressId(`custom-${Date.now()}`);
                    }}
                    placeholder="Enter your flat/house no., street, landmark, city..."
                    rows={3}
                    className="w-full px-4 py-3 bg-orange-50/40 border-2 border-orange-200 rounded-2xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none shadow-2xs"
                  />
                  <p className="text-[11px] text-neutral-400 font-medium">
                    💡 Tip: You can edit or add your Flat/Apartment number, floor, or nearby landmark above even after fetching location.
                  </p>
                </div>
              </div>

              {/* Contact Details */}
              <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-orange-600"
                    style={{ background: '#FFF7F0' }}>
                    <PhoneOutlined className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-900">Contact Details</h3>
                    <p className="text-xs text-neutral-400">We'll use this number for order updates</p>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <PhoneOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-800 focus:outline-none focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                      Email (Optional)
                    </label>
                    <div className="relative">
                      <MailOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-2xl text-sm font-medium text-neutral-800 focus:outline-none focus:border-orange-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-orange-600"
                    style={{ background: '#FFF7F0' }}>
                    <MessageOutlined className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-neutral-900">Delivery Instructions (Optional)</h3>
                    <p className="text-xs text-neutral-400">Add any special instructions for your delivery partner</p>
                  </div>
                </div>
                <div className="p-6">
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Ring the bell, leave at the door, call on arrival, etc."
                    rows={3}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm text-neutral-800 focus:outline-none focus:border-orange-400 transition-all resize-none"
                  />
                </div>
              </div>

            </div>

            {/* ── RIGHT: Order Summary + Payment ── */}
            <div className="lg:col-span-1 space-y-5">

              {/* Order Summary */}
              <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden sticky top-24">
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-neutral-900">Order Summary</h3>
                  <button
                    onClick={() => navigate('/customer/cart')}
                    className="text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    style={{ color: '#F97316' }}
                  >
                    <EditOutlined /> Edit Cart
                  </button>
                </div>

                {/* Items */}
                <div className="px-5 py-4 space-y-3 max-h-48 overflow-y-auto divide-y divide-neutral-50">
                  {items.map((item) => (
                    <div key={item.id || item.cartItemId} className="flex items-center gap-3 pt-2 first:pt-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200/60">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">🍴</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-900 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-neutral-400">{item.quantity} x ₹{Number(item.price).toFixed(2)}</p>
                      </div>
                      <span className="text-xs font-extrabold text-neutral-800 flex-shrink-0">
                        ₹{(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Subtotals (Dynamic Calculations matching Cart Page) */}
                <div className="px-5 py-4 border-t border-neutral-100 space-y-2.5 text-sm">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                    <span className="font-bold text-neutral-800">₹{subtotal.toFixed(2)}</span>
                  </div>

                  {/* Display Promo Discount if applied */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 font-bold text-xs">
                      <span className="flex items-center gap-1">
                        <TagOutlined /> Promo Discount ({appliedCoupon?.code})
                      </span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-neutral-500">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-neutral-800">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Platform Fee</span>
                    <span className="font-bold text-neutral-800">₹{platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>GST (5%)</span>
                    <span className="font-bold text-neutral-800">₹{gst.toFixed(2)}</span>
                  </div>

                  {/* Support local restaurants banner */}
                  <div className="py-2 px-3 rounded-xl text-xs font-medium mt-1"
                    style={{ background: '#F0FFF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                    🌿 You're supporting local restaurants! ❤️<br />
                    <span className="text-neutral-500">Thank you for choosing Orderly.</span>
                  </div>

                  <div className="border-t border-neutral-100 pt-3 flex justify-between items-center">
                    <span className="font-black text-neutral-900 text-base">Total</span>
                    <span className="font-black text-xl" style={{ color: '#F97316' }}>₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="px-5 pb-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between pt-3 pb-2">
                    <h4 className="font-extrabold text-neutral-900 text-sm">Payment Method</h4>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <LockOutlined /> Powered by Razorpay
                    </span>
                  </div>

                  {/* Razorpay Option */}
                  <div
                    onClick={() => setPaymentMethod('razorpay')}
                    className="p-3 rounded-2xl border-2 cursor-pointer transition-all mb-2"
                    style={{
                      borderColor: paymentMethod === 'razorpay' ? '#F97316' : '#E5E7EB',
                      background: paymentMethod === 'razorpay' ? '#FFF7F0' : 'white'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: '#F97316' }}
                        >
                          {paymentMethod === 'razorpay' && (
                            <div className="w-2 h-2 rounded-full" style={{ background: '#F97316' }} />
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className="px-2 py-0.5 rounded text-white font-black text-xs"
                            style={{ background: '#2B6CB0' }}
                          >
                            Razorpay
                          </div>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: '#DCFCE7', color: '#15803D' }}
                          >
                            Recommended
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                      {['UPI', 'Visa', 'MC', 'RuPay', '●Pay', 'G Pay'].map(m => (
                        <span key={m}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600"
                        >{m}</span>
                      ))}
                    </div>
                  </div>

                  {/* COD Option */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className="p-3 rounded-2xl border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: paymentMethod === 'cod' ? '#F97316' : '#E5E7EB',
                      background: paymentMethod === 'cod' ? '#FFF7F0' : 'white'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: '#F97316' }}
                      >
                        {paymentMethod === 'cod' && (
                          <div className="w-2 h-2 rounded-full" style={{ background: '#F97316' }} />
                        )}
                      </div>
                      <span className="text-xs font-bold text-neutral-700">💵 Cash on Delivery</span>
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <div className="px-5 pb-5 pt-4">
                  <button
                    disabled={loading || (!selectedAddressId && !address.trim())}
                    onClick={handlePlaceOrder}
                    className="w-full py-4 rounded-2xl font-extrabold text-base text-white transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    style={{
                      background: (loading || (!selectedAddressId && !address.trim()))
                        ? '#D1D5DB'
                        : 'linear-gradient(135deg, #F97316 0%, #DC2626 100%)',
                      cursor: (loading || (!selectedAddressId && !address.trim())) ? 'not-allowed' : 'pointer',
                      boxShadow: (loading || (!selectedAddressId && !address.trim())) ? 'none' : '0 8px 24px rgba(249,115,22,0.35)'
                    }}
                  >
                    {loading ? (
                      <span>Processing Order...</span>
                    ) : paymentMethod === 'razorpay' ? (
                      <>
                        <span>Pay ₹{grandTotal.toFixed(2)} with Razorpay</span>
                        <span>→</span>
                      </>
                    ) : (
                      <>
                        <span>Place Order — COD (₹{grandTotal.toFixed(2)})</span>
                        <span>→</span>
                      </>
                    )}
                  </button>

                  <div className="text-center mt-3 flex items-center justify-center gap-1.5 text-neutral-400 text-[11px]">
                    <LockOutlined />
                    <span>Your payment information is safe and encrypted.</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="px-5 pb-5 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-4">
                  {[
                    { icon: <ThunderboltOutlined />, label: 'Fast Delivery' },
                    { icon: <SafetyOutlined />, label: 'Secure Payments' },
                    { icon: <HeartOutlined />, label: 'Support Local' }
                  ].map((b) => (
                    <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-orange-600"
                        style={{ background: '#FFF7F0' }}>
                        {b.icon}
                      </div>
                      <p className="text-[10px] font-bold text-neutral-500 leading-tight">{b.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side typography */}
              <div className="hidden lg:block text-right">
                <p className="font-black text-3xl leading-tight"
                  style={{ color: '#F97316', opacity: 0.15, fontSize: '2rem', lineHeight: 1.2 }}>
                  Eat Good<br />Live Better
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
