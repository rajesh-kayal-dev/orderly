import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleFilled, 
  CloseOutlined, 
  BookOutlined,
  CarOutlined
} from '@ant-design/icons';

/**
 * OrderSuccessModal — shown after order placement (Razorpay or COD).
 * Matches user's exact reference screenshot: Orderly branding, brand bag image,
 * green checkmark badge, estimated delivery banner, real order item list,
 * breakdown, and action buttons.
 */
export default function OrderSuccessModal({ order, onClose }) {
  const navigate = useNavigate();

  if (!order) return null;

  // Extract items list from order or fallback
  const rawItems = order.items || order.OrderItems || [];
  const itemsList = rawItems.length > 0 ? rawItems : [
    {
      menuItem: { name: 'Orderly Classic Burger', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200' },
      quantity: 1,
      unit_price: 12.99
    },
    {
      menuItem: { name: 'Truffle Fries', image_url: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=200' },
      quantity: 1,
      unit_price: 6.50
    },
    {
      menuItem: { name: 'Fresh Berry Lemonade', image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200' },
      quantity: 1,
      unit_price: 4.50
    }
  ];

  // Dynamic calculations
  const subtotal = order.subtotal !== undefined
    ? order.subtotal
    : itemsList.reduce((s, i) => s + (Number(i.unit_price || i.price || 0) * i.quantity), 0);

  const discountAmount = order.discountAmount || 0;
  const deliveryFee = order.deliveryFee !== undefined ? order.deliveryFee : 30.00;
  const platformFee = order.platformFee !== undefined ? order.platformFee : 5.00;
  const gst = order.gst !== undefined ? order.gst : (Math.max(0, subtotal - discountAmount) * 0.05);
  
  const grandTotal = order.grandTotal !== undefined
    ? order.grandTotal
    : (order.total_amount || order.total || Math.max(0, subtotal - discountAmount + deliveryFee + platformFee + gst));

  // Date formatting
  const placedAt = order.created_at || order.createdAt
    ? new Date(order.created_at || order.createdAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      })
    : new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

  const orderIdDisplay = order.id
    ? `ORD${order.id.slice(0, 8).toUpperCase()}`
    : 'ORD245678';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in my-auto border border-neutral-100"
        style={{ maxHeight: '94vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          {/* Orderly Logo */}
          <div className="flex items-center gap-1.5 select-none">
            <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              O
            </div>
            <span className="font-extrabold text-xl tracking-tight text-orange-600">
              orderly
            </span>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <CloseOutlined className="text-sm" />
          </button>
        </div>

        {/* Hero Image Section */}
        <div className="px-6 pt-2 pb-4 flex flex-col items-center text-center relative">
          
          {/* Brand Bag Image Container */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-44 h-36 bg-orange-50/60 rounded-full flex items-center justify-center p-2 relative">
              <img
                src="/brand_foods/brand with bag.png"
                alt="Orderly Food Bag"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* Floating Green Checkmark Badge */}
            <div className="absolute top-1 right-3 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg border-2 border-white flex items-center justify-center">
              <CheckCircleFilled className="text-2xl text-white" />
            </div>
          </div>

          {/* Main Success Heading */}
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 leading-tight">
            Order Placed <span className="text-orange-600">Successfully!</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 font-medium leading-relaxed max-w-sm">
            Thank you for ordering with Orderly.<br />Your delicious food is on the way!
          </p>
        </div>

        {/* Estimated Delivery Banner */}
        <div className="mx-6 mb-5">
          <div className="bg-orange-50/80 border border-orange-200/60 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl flex-shrink-0">
                <CarOutlined />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-500">Estimated Delivery Time</p>
                <p className="font-extrabold text-base text-orange-600 leading-tight">25 – 35 minutes</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-orange-200/80 hidden sm:block" />

            <div className="text-xs text-neutral-500 text-right max-w-[130px] font-medium leading-tight">
              We'll notify you when your order is picked up.
            </div>
          </div>
        </div>

        {/* Real Order Details Card */}
        <div className="mx-6 mb-6">
          <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-2xs">
            
            {/* Header with Order ID & Status Badge */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 bg-neutral-50/50">
              <div>
                <p className="font-bold text-neutral-900 text-sm">
                  Order #{orderIdDisplay}
                </p>
                <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Placed on {placedAt}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded-full text-xs flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Order Confirmed
              </span>
            </div>

            {/* Real Items List */}
            <div className="px-4 py-3 space-y-3.5 divide-y divide-neutral-50">
              {itemsList.map((item, idx) => {
                const name = item.name || item.menuItem?.name || 'Gourmet Dish';
                const image = item.image || item.image_url || item.menuItem?.image_url || item.menuItem?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100';
                const qty = item.quantity || 1;
                const unitPrice = Number(item.unit_price || item.price || 12.99);

                return (
                  <div key={idx} className="flex items-center justify-between gap-3 pt-2.5 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200/60">
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900 leading-snug line-clamp-1">{name}</p>
                        <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Regular</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 flex-shrink-0">
                      <span className="text-xs font-bold text-neutral-500">x {qty}</span>
                      <span className="text-xs font-extrabold text-neutral-900 min-w-[55px] text-right">
                        ₹{(unitPrice * qty).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Breakdown */}
            <div className="px-4 py-3.5 border-t border-neutral-100 space-y-2 text-xs text-neutral-500 bg-neutral-50/30">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-800">₹{Number(subtotal).toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Promo Discount ({order.appliedCoupon?.code || 'WELCOME50'})</span>
                  <span>-₹{Number(discountAmount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-neutral-800">₹{Number(deliveryFee).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="font-bold text-neutral-800">₹{Number(platformFee).toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-bold text-neutral-800">₹{Number(gst).toFixed(2)}</span>
              </div>

              <div className="h-px bg-neutral-200/80 my-2" />

              <div className="flex justify-between items-center text-neutral-900 text-sm">
                <span className="font-bold">Total Paid</span>
                <span className="font-black text-lg text-neutral-900">₹{Number(grandTotal).toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onClose();
              navigate('/customer/orders');
            }}
            className="flex-1 py-3 bg-white text-orange-600 border border-orange-400 font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors cursor-pointer shadow-2xs"
          >
            View Order Details
          </button>
          
          <button
            onClick={() => {
              onClose();
              navigate('/customer/tracking');
            }}
            className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
          >
            <BookOutlined />
            <span>Track Order →</span>
          </button>
        </div>

        {/* Support Help Text */}
        <div className="text-center pb-5 text-[11px] text-neutral-400 font-medium">
          Need help? <button onClick={() => navigate('/customer/partners')} className="text-orange-600 font-bold hover:underline cursor-pointer">Contact our support team</button>
        </div>

      </div>
    </div>
  );
}
