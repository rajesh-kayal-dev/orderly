import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from '../../api/axios';
import { loginSuccess } from '../../redux/slices/authSlice';
import socket from '../../socket';
import { notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  HistoryOutlined,
  PhoneOutlined,
  MailOutlined,
  LockOutlined,
  HomeOutlined
} from '@ant-design/icons';

const ProfileSchema = Yup.object().shape({
  full_name: Yup.string().required('Full name is required'),
  phone_number: Yup.string().required('Phone number is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters'),
  address: Yup.string(),
  restaurant_name: Yup.string(),
  location: Yup.string(),
  cuisine_type: Yup.string(),
  vehicle_license: Yup.string(),
});

export default function Profile() {
  const { user, profile, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [confirmedOrders, setConfirmedOrders] = useState(0);

  useEffect(() => {
    if (user?.role === 'customer') {
      axios.get('/orders/me?limit=1').then(r => {
        if (r.data.success) {
          setTotalOrders(r.data.total || 0);
          setConfirmedOrders(r.data.confirmedCount || 0);
        }
      }).catch(() => {});
    }
  }, [user]);

  if (!user) return (
    <div className="py-20 text-center text-neutral-500 font-semibold">
      Please sign in to view your account profile.
    </div>
  );

  return (
    <div className="pb-16 animate-fade-in -mt-16">

      {/* ── FULL-BLEED HERO BANNER (same style as Restaurants & Menu) ── */}
      <div className="relative bg-neutral-900 text-white pt-24 pb-16 border-b border-neutral-800 overflow-hidden">
        <img
          src="/food_banners/gourmet-banner-2.jpg"
          alt="Profile Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              👤 Account Management
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">My Profile</h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Manage your details, delivery addresses, and view past orders.
            </p>
          </div>

          {/* Avatar card */}
          <div className="hidden lg:flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-bold text-white text-base">{user.full_name}</p>
              <p className="text-orange-400 text-xs font-bold uppercase tracking-wider">{user.role} Account</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Grid: Form + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Profile Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-lg font-extrabold text-neutral-900 border-b border-neutral-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <UserOutlined className="text-xl" />
              </div>
              <span>Personal Information</span>
            </div>

            <Formik
              enableReinitialize
              initialValues={{
                full_name: user.full_name || '',
                phone_number: user.phone_number || '',
                password: '',
                restaurant_name: profile?.name || '',
                location: profile?.location || '',
                cuisine_type: profile?.cuisine_type || '',
                vehicle_license: profile?.vehicle_license || '',
                address: profile?.Addresses?.find(a => a.is_default)?.street || profile?.Addresses?.[0]?.street || profile?.address || '',
              }}
              validationSchema={ProfileSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  setLoading(true);
                  const response = await axios.put('/auth/profile', values);
                  if (response.data.success) {
                    const updatedData = response.data.data;
                    let activeProfile = updatedData.Customer || updatedData.Restaurant || updatedData.DeliveryPartner || updatedData.Admin || null;
                    dispatch(loginSuccess({
                      user: { id: updatedData.id, email: updatedData.email, role: updatedData.role, full_name: updatedData.full_name, phone_number: updatedData.phone_number },
                      profile: activeProfile,
                      token,
                    }));
                    notification.success({ message: 'Profile Saved', description: 'Your profile changes have been updated successfully.', placement: 'topRight' });
                  }
                } catch (err) {
                  notification.error({ message: 'Update Failed', description: err.response?.data?.message || 'Something went wrong.' });
                } finally {
                  setLoading(false);
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Full Name</label>
                    <div className="relative">
                      <UserOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                      <Field type="text" name="full_name" className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-800 focus:outline-none focus:border-orange-500" />
                    </div>
                    <ErrorMessage name="full_name" component="div" className="text-red-500 text-xs font-semibold mt-1" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <div className="relative">
                      <PhoneOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                      <Field type="text" name="phone_number" className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-800 focus:outline-none focus:border-orange-500" />
                    </div>
                    <ErrorMessage name="phone_number" component="div" className="text-red-500 text-xs font-semibold mt-1" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <MailOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                      <input type="email" value={user.email} disabled className="w-full pl-11 pr-4 py-3.5 bg-neutral-100 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-400 cursor-not-allowed" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">New Password</label>
                    <div className="relative">
                      <LockOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                      <Field type="password" name="password" placeholder="Leave blank to keep current" className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-800 focus:outline-none focus:border-orange-500" />
                    </div>
                    <ErrorMessage name="password" component="div" className="text-red-500 text-xs font-semibold mt-1" />
                  </div>

                  {user.role === 'customer' && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1.5">Default Delivery Address</label>
                      <div className="relative">
                        <HomeOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
                        <Field type="text" name="address" placeholder="Street address, city, postal code" className="w-full pl-11 pr-4 py-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-800 focus:outline-none focus:border-orange-500" />
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || loading}
                      className="px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-600/20 transition-all hover:scale-105 active:scale-95"
                    >
                      {isSubmitting || loading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>

          {/* Right: Stats */}
          <div className="space-y-6">
            {/* Account card */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 font-extrabold text-xl flex items-center justify-center">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-base leading-tight">{user.full_name}</h3>
                  <p className="text-xs text-orange-600 font-bold uppercase tracking-wider mt-0.5">{user.role} Account</p>
                </div>
              </div>
              <div className="border-t border-neutral-100 pt-4 space-y-3 text-xs text-neutral-600 font-medium">
                <div className="flex justify-between">
                  <span>Account Email</span>
                  <span className="font-bold text-neutral-800 truncate max-w-[160px]">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone</span>
                  <span className="font-bold text-neutral-800">{user.phone_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Activity Summary + View Orders shortcut */}
            {user.role === 'customer' && (
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Activity Summary</span>
                  <HistoryOutlined className="text-lg text-neutral-400" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-black text-white">{totalOrders}</p>
                    <p className="text-[11px] text-neutral-400 font-medium">Total Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-400">{confirmedOrders}</p>
                    <p className="text-[11px] text-neutral-400 font-medium">Delivered</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/customer/orders')}
                  className="w-full mt-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  View My Orders →
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
