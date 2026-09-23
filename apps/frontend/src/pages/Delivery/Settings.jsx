import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from '../../api/axios';
import { loginSuccess } from '../../redux/slices/authSlice';
import { notification } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  LockOutlined,
  CarOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  RightOutlined
} from '@ant-design/icons';

const DriverSettingsSchema = Yup.object().shape({
  full_name: Yup.string().required('Full name is required'),
  phone_number: Yup.string().required('Phone number is required'),
  emergency_contact: Yup.string(),
  vehicle_type: Yup.string().required('Select vehicle type'),
  vehicle_name: Yup.string().required('Vehicle model name is required'),
  vehicle_license: Yup.string().required('License plate number is required'),
  driving_license_no: Yup.string(),
  address: Yup.string().required('Base address is required'),
  operating_zone: Yup.string().required('Select operating zone'),
  delivery_category: Yup.string().required('Select primary category'),
  password: Yup.string().min(6, 'Password must be at least 6 characters'),
});

export default function DeliverySettings() {
  const { user, profile, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // Preference Toggles
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [nightGuidance, setNightGuidance] = useState(true);

  if (!user) return (
    <div className="py-20 text-center text-slate-400 font-semibold text-xs">
      Please sign in to access Driver Settings.
    </div>
  );

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-4 text-slate-800">
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF521C] flex items-center justify-center text-xl shadow-2xs">
            <SettingOutlined />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Driver Profile & Vehicle Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Update vehicle specs, operating zones, delivery categories & app preferences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
          <CheckCircleOutlined className="text-xs" />
          <span>Driver Account Verified</span>
        </div>
      </div>

      <Formik
        enableReinitialize
        initialValues={{
          full_name: user?.full_name || '',
          phone_number: user?.phone_number || '',
          emergency_contact: profile?.emergency_contact || '+91 98765 43210',
          vehicle_type: profile?.vehicle_type || 'Scooter / Bike',
          vehicle_name: profile?.vehicle_name || 'Honda Activa 6G',
          vehicle_license: profile?.vehicle_license || 'MH 12 AB 1234',
          driving_license_no: profile?.driving_license_no || 'DL-042021009876',
          address: profile?.address || '102 Coral Park, SB Road, Pune',
          operating_zone: profile?.operating_zone || 'Central City Zone',
          delivery_category: profile?.delivery_category || 'Express Food Delivery',
          password: '',
        }}
        validationSchema={DriverSettingsSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            setLoading(true);
            const response = await axios.put('/auth/profile', values);
            if (response.data.success) {
              const updatedData = response.data.data;
              const activeProfile = updatedData.DeliveryPartner || updatedData.Customer || updatedData.Restaurant || profile;
              
              dispatch(loginSuccess({
                user: {
                  id: updatedData.id,
                  email: updatedData.email,
                  role: updatedData.role,
                  full_name: updatedData.full_name,
                  phone_number: updatedData.phone_number
                },
                profile: activeProfile,
                token
              }));

              notification.success({
                title: 'Driver Settings Saved',
                description: 'Your profile, vehicle info, and operating zone have been updated.',
                placement: 'topRight'
              });
            }
          } catch (err) {
            notification.error({
              title: 'Update Failed',
              description: err.response?.data?.message || 'Failed to update driver settings.'
            });
          } finally {
            setLoading(false);
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values }) => (
          <Form className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left 2 Columns: Main Settings Sections */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Section 1: Personal Details */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <UserOutlined className="text-orange-500 text-base" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    1. Driver Personal Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Full Name</label>
                    <div className="relative">
                      <UserOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Field 
                        type="text" 
                        name="full_name" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]" 
                      />
                    </div>
                    <ErrorMessage name="full_name" component="div" className="text-red-500 text-[10px] font-bold mt-0.5" />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Phone Number</label>
                    <div className="relative">
                      <PhoneOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Field 
                        type="text" 
                        name="phone_number" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]" 
                      />
                    </div>
                    <ErrorMessage name="phone_number" component="div" className="text-red-500 text-[10px] font-bold mt-0.5" />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Account Email (Read Only)</label>
                    <div className="relative">
                      <MailOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="email" 
                        value={user?.email || ''} 
                        disabled 
                        className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-400 cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Emergency Contact Number</label>
                    <div className="relative">
                      <PhoneOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Field 
                        type="text" 
                        name="emergency_contact" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle & License Details */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <CarOutlined className="text-[#FF521C] text-base" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    2. Vehicle Specifications & Driving License
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Vehicle Type</label>
                    <Field 
                      as="select" 
                      name="vehicle_type" 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]"
                    >
                      <option value="Scooter / Bike">🛵 Scooter / Motorbike</option>
                      <option value="Electric EV Scooter">⚡ Electric EV Scooter</option>
                      <option value="Bicycle">🚲 Bicycle</option>
                      <option value="Car / Four-Wheeler">🚗 Car / Four-Wheeler</option>
                    </Field>
                    <ErrorMessage name="vehicle_type" component="div" className="text-red-500 text-[10px] font-bold mt-0.5" />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Vehicle Model & Make</label>
                    <div className="relative">
                      <CarOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Field 
                        type="text" 
                        name="vehicle_name" 
                        placeholder="e.g. Honda Activa 6G / TVS iQube" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]" 
                      />
                    </div>
                    <ErrorMessage name="vehicle_name" component="div" className="text-red-500 text-[10px] font-bold mt-0.5" />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Vehicle License Plate Number</label>
                    <div className="relative">
                      <IdcardOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Field 
                        type="text" 
                        name="vehicle_license" 
                        placeholder="e.g. MH 12 AB 1234" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 uppercase focus:outline-none focus:border-[#FF521C]" 
                      />
                    </div>
                    <ErrorMessage name="vehicle_license" component="div" className="text-red-500 text-[10px] font-bold mt-0.5" />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Driving License Number</label>
                    <div className="relative">
                      <SafetyCertificateOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Field 
                        type="text" 
                        name="driving_license_no" 
                        placeholder="e.g. DL-042021009876" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 uppercase focus:outline-none focus:border-[#FF521C]" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Base Address & Delivery Zone */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <EnvironmentOutlined className="text-emerald-600 text-base" />
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    3. Base Operating Address & Service Zone
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-600 mb-1">Base Home / Depot Address</label>
                    <div className="relative">
                      <EnvironmentOutlined className="absolute left-3 top-3 text-slate-400" />
                      <Field 
                        as="textarea" 
                        rows="2" 
                        name="address" 
                        placeholder="House no, Street name, City, Postal Code" 
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]" 
                      />
                    </div>
                    <ErrorMessage name="address" component="div" className="text-red-500 text-[10px] font-bold mt-0.5" />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Preferred Operating Zone</label>
                    <Field 
                      as="select" 
                      name="operating_zone" 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]"
                    >
                      <option value="Central City Zone">🏙️ Central City Zone</option>
                      <option value="North Suburbs & Tech Park">🏢 North Suburbs & Tech Park</option>
                      <option value="South Corridor & Mall Radius">🏬 South Corridor & Mall Radius</option>
                      <option value="Airport & Highway Express">✈️ Airport & Highway Express</option>
                    </Field>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Delivery Service Category</label>
                    <Field 
                      as="select" 
                      name="delivery_category" 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]"
                    >
                      <option value="Express Food Delivery">🍔 Express Food Delivery</option>
                      <option value="Instant Grocery & Mart">🛒 Instant Grocery & Mart</option>
                      <option value="High Volume Multi-Drop">📦 High Volume Multi-Drop</option>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Submit Button Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  Click save to persist changes across driver app services.
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all"
                >
                  <span>{isSubmitting || loading ? 'Saving Profile...' : 'Save Settings ✓'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Preferences, Security & Live Status Card */}
            <div className="space-y-4">
              
              {/* App Preferences & Automation Widget */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <BellOutlined className="text-[#FF521C] text-base" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    App Preferences
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Sound Alerts */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">Delivery Sound Ringtone</p>
                      <p className="text-[10px] text-slate-500">Play alert sound on new orders</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSoundAlerts(!soundAlerts)}
                      className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                        soundAlerts ? 'bg-[#FF521C]' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                        soundAlerts ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Auto Accept */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">Auto-Accept Express</p>
                      <p className="text-[10px] text-slate-500">Auto accept high pay offers</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoAccept(!autoAccept)}
                      className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                        autoAccept ? 'bg-[#FF521C]' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                        autoAccept ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Night Guidance */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">Night Route Mode</p>
                      <p className="text-[10px] text-slate-500">High contrast maps after 7 PM</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNightGuidance(!nightGuidance)}
                      className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                        nightGuidance ? 'bg-[#FF521C]' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                        nightGuidance ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Update Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <LockOutlined className="text-rose-500 text-base" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Account Security
                  </h3>
                </div>

                <div className="text-xs space-y-2">
                  <label className="block font-bold text-slate-600">Update Password</label>
                  <div className="relative">
                    <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Field 
                      type="password" 
                      name="password" 
                      placeholder="Leave blank to keep current" 
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]" 
                    />
                  </div>
                  <ErrorMessage name="password" component="div" className="text-red-500 text-[10px] font-bold" />
                </div>
              </div>

              {/* Live Vehicle & Partner Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                    Live Vehicle Specs
                  </span>
                  <ThunderboltOutlined className="text-amber-400 text-sm" />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Vehicle</span>
                    <span className="font-bold text-white">{values.vehicle_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Plate No</span>
                    <span className="font-mono font-bold text-orange-400">{values.vehicle_license}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Zone</span>
                    <span className="font-bold text-white">{values.operating_zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Category</span>
                    <span className="font-bold text-emerald-400">{values.delivery_category}</span>
                  </div>
                </div>
              </div>

            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
