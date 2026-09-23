import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/slices/authSlice';
import { fetchCart } from '../../redux/slices/cartSlice';
import axios from '../../api/axios';
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  PhoneOutlined, 
  SolutionOutlined, 
  ArrowRightOutlined, 
  ShopOutlined, 
  IdcardOutlined, 
  ArrowLeftOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  CarOutlined,
  GoogleOutlined,
  FacebookFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  AppstoreOutlined,
  RiseOutlined,
  HeartOutlined
} from '@ant-design/icons';
import BrandLogo from '../../components/common/BrandLogo';

const RegisterSchema = Yup.object().shape({
  full_name: Yup.string().required('Full name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirm_password: Yup.string().when('role', {
    is: (val) => val === 'restaurant' || val === 'delivery_partner',
    then: () => Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    otherwise: () => Yup.string().notRequired()
  }),
  phone_number: Yup.string().required('Phone number is required'),
  role: Yup.string().oneOf(['customer', 'restaurant', 'delivery_partner'], 'Invalid role').required('Role is required'),
  
  // Restaurant specific validation
  name: Yup.string().when('role', {
    is: 'restaurant',
    then: () => Yup.string().required('Restaurant name is required'),
    otherwise: () => Yup.string().notRequired()
  }),
  address: Yup.string().when('role', {
    is: 'restaurant',
    then: () => Yup.string().required('Restaurant address is required'),
    otherwise: () => Yup.string().notRequired()
  }),
  business_license: Yup.string().when('role', {
    is: 'restaurant',
    then: () => Yup.string().required('Business license is required'),
    otherwise: () => Yup.string().notRequired()
  }),

  // Driver specific validation
  vehicle_license: Yup.string().when('role', {
    is: 'delivery_partner',
    then: () => Yup.string().required('License plate is required'),
    otherwise: () => Yup.string().notRequired()
  }),
  id_card: Yup.string().when('role', {
    is: 'delivery_partner',
    then: () => Yup.string().required('ID Card number is required'),
    otherwise: () => Yup.string().notRequired()
  }),
  vehicle_type: Yup.string().when('role', {
    is: 'delivery_partner',
    then: () => Yup.string().required('Vehicle type is required'),
    otherwise: () => Yup.string().notRequired()
  })
});

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: Selection, 1: Form
  const [selectedRole, setSelectedRole] = useState('customer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRedirect = (role) => {
    switch (role?.toLowerCase()) {
      case 'customer':
        navigate('/customer');
        break;
      case 'restaurant':
        navigate('/restaurant');
        break;
      case 'delivery_partner':
        navigate('/delivery');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/customer');
    }
  };

  const roles = [
    { 
      id: 'customer', 
      title: 'Customer', 
      desc: 'Order delicious food from your favorite restaurants.',
      icon: <UserOutlined className="text-2xl" />,
      color: 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
    },
    { 
      id: 'restaurant', 
      title: 'Restaurant', 
      desc: 'Partner with us and grow your food business.',
      icon: <ShopOutlined className="text-2xl" />,
      color: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
    },
    { 
      id: 'delivery_partner', 
      title: 'Delivery Partner', 
      desc: 'Earn money on your own schedule with deliveries.',
      icon: <CarOutlined className="text-2xl" />,
      color: 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setStep(1);
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  // Expanded container layout for multi-field forms like Restaurant or Delivery Partner
  const isMultiColumn = step === 1 && selectedRole !== 'customer';

  return (
    <div className="min-h-screen flex items-center justify-center auth-page-wrapper p-4 md:p-8">
      <div className={`auth-card ${isMultiColumn ? 'max-w-5xl' : 'max-w-5xl'}`}>
        
        {/* LEFT HERO SIDE */}
        {step === 0 ? (
          /* Step 0 Hero: Warm Light Cream Panel (Role Selection) */
          <div className="auth-illustration-light justify-between">
            <div>
              <BrandLogo variant="orange" size="lg" to="/register" className="mb-4" />
              
              <span className="auth-pill-badge-orange">GET STARTED</span>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2 tracking-tight">
                How do you want <br />
                to join <span className="text-orange-500">Orderly?</span>
              </h1>
              
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-xs mb-2">
                Choose your path and be part of our food community.
              </p>
            </div>

            {/* Hero Image & Cursive Handwritten Tagline */}
            <div className="relative my-2 flex flex-col items-center">
              <div className="absolute top-2 -left-2 font-handwriting text-xl md:text-2xl text-orange-600 font-bold tracking-wide rotate-[-8deg] z-10">
                Good Food <br /> Brighter Days ~
              </div>
              <img 
                src="/brand_foods/brand with bag.png" 
                alt="Orderly Bag & Pizza" 
                className="w-full max-w-[300px] rounded-2xl object-cover drop-shadow-xl animate-float mx-auto md:mx-0"
              />
            </div>

            {/* Bottom Feature Highlights Horizontal Row */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200/70 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                  <CheckCircleOutlined />
                </div>
                <div className="text-[10px] leading-tight">
                  <div className="font-bold text-gray-900">Fresh & Delicious</div>
                  <div className="text-gray-500 font-normal">From top rated restaurants</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                  <CarOutlined />
                </div>
                <div className="text-[10px] leading-tight">
                  <div className="font-bold text-gray-900">Fast Delivery</div>
                  <div className="text-gray-500 font-normal">Right to your doorstep</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
                  <HeartOutlined />
                </div>
                <div className="text-[10px] leading-tight">
                  <div className="font-bold text-gray-900">Happy Customers</div>
                  <div className="text-gray-500 font-normal">Trusted by thousands</div>
                </div>
              </div>
            </div>
          </div>
        ) : selectedRole === 'customer' ? (
          /* Customer Register Hero: Orange Gradient (Panel 2) */
          <div className="auth-illustration-orange">
            <div>
              <BrandLogo variant="light" size="lg" to="/register" className="mb-4" />
              
              <span className="auth-pill-badge-white">CREATE AN ACCOUNT</span>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2 tracking-tight">
                Join the <br />
                Orderly Family
              </h1>
              
              <p className="text-xs md:text-sm text-white/90 leading-relaxed max-w-xs mb-6">
                Get started and enjoy delicious food from the best restaurants in town.
              </p>

              {/* Feature Highlights */}
              <div className="space-y-3 max-w-xs mb-4">
                <div className="auth-feature-item-orange">
                  <div className="auth-feature-icon-orange">
                    <CheckCircleOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-white leading-tight">Wide Variety</h4>
                    <p className="text-[11px] text-white/80">Explore multiple cuisines</p>
                  </div>
                </div>

                <div className="auth-feature-item-orange">
                  <div className="auth-feature-icon-orange">
                    <SafetyOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-white leading-tight">Secure & Safe</h4>
                    <p className="text-[11px] text-white/80">Your data is always protected</p>
                  </div>
                </div>

                <div className="auth-feature-item-orange">
                  <div className="auth-feature-icon-orange">
                    <ThunderboltOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-white leading-tight">Quick & Easy</h4>
                    <p className="text-[11px] text-white/80">Get started in minutes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-2 flex flex-col items-start">
              <img 
                src="/brand_foods/brand with bag.png" 
                alt="Orderly Brand Bag" 
                className="w-full max-w-[270px] rounded-2xl object-cover drop-shadow-2xl animate-float mx-auto md:mx-0"
              />
              <div className="font-handwriting text-2xl md:text-3xl text-white font-bold tracking-wide mt-1 rotate-[-4deg] drop-shadow-md">
                Good Food Brighter Days ~
              </div>
            </div>
          </div>
        ) : (
          /* Restaurant / Partner Register Hero: Orange Gradient (Panel 4) */
          <div className="auth-illustration-orange">
            <div>
              <BrandLogo variant="light" size="lg" to="/register" className="mb-4" />
              
              <span className="auth-pill-badge-white">
                {selectedRole === 'restaurant' ? 'PARTNER WITH US' : 'DRIVE WITH US'}
              </span>
              
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2 tracking-tight">
                {selectedRole === 'restaurant' ? 'Grow Your Restaurant with Orderly' : 'Deliver & Earn with Orderly'}
              </h1>
              
              <p className="text-xs md:text-sm text-white/90 leading-relaxed max-w-xs mb-6">
                {selectedRole === 'restaurant' 
                  ? 'Reach more customers, increase your sales, and let us handle the delivery.' 
                  : 'Flexible working hours, great earnings, and instant payouts.'}
              </p>

              {/* Partner Feature Highlights */}
              <div className="space-y-3 max-w-xs mb-4">
                <div className="auth-feature-item-orange">
                  <div className="auth-feature-icon-orange">
                    <TeamOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-white leading-tight">
                      {selectedRole === 'restaurant' ? 'More Customers' : 'Flexible Hours'}
                    </h4>
                    <p className="text-[11px] text-white/80">
                      {selectedRole === 'restaurant' ? 'Get discovered by food lovers' : 'Work on your own schedule'}
                    </p>
                  </div>
                </div>

                <div className="auth-feature-item-orange">
                  <div className="auth-feature-icon-orange">
                    <AppstoreOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-white leading-tight">
                      {selectedRole === 'restaurant' ? 'Easy Management' : 'High Earnings'}
                    </h4>
                    <p className="text-[11px] text-white/80">
                      {selectedRole === 'restaurant' ? 'Manage menu and orders easily' : 'Keep 100% of your tips'}
                    </p>
                  </div>
                </div>

                <div className="auth-feature-item-orange">
                  <div className="auth-feature-icon-orange">
                    <RiseOutlined />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs md:text-sm text-white leading-tight">
                      {selectedRole === 'restaurant' ? 'Business Growth' : 'Fast Payouts'}
                    </h4>
                    <p className="text-[11px] text-white/80">
                      {selectedRole === 'restaurant' ? "Focus on cooking, we'll do the rest" : 'Get paid directly to your bank'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-2 flex flex-col items-start">
              <img 
                src="/brand_foods/brand with nuddels.png" 
                alt="Orderly Noodles & Brand" 
                className="w-full max-w-[270px] rounded-2xl object-cover drop-shadow-2xl animate-float mx-auto md:mx-0"
              />
              <div className="font-handwriting text-2xl md:text-3xl text-white font-bold tracking-wide mt-1 rotate-[-4deg] drop-shadow-md">
                Good Food Brighter Days ~
              </div>
            </div>
          </div>
        )}

        {/* RIGHT FORM SIDE */}
        <div className="auth-form-side relative">
          {step === 0 ? (
            /* STEP 0: Role Selection Cards */
            <div className="flex flex-col justify-between h-full">
              {/* Top Right Handwritten Callout */}
              <div className="absolute top-4 right-6 font-handwriting text-orange-500 text-sm md:text-base font-bold rotate-[5deg] hidden sm:block select-none pointer-events-none">
                Different People <br /> Same Great Food! <span className="tracking-tighter">//</span>
              </div>

              <div className="space-y-4 my-auto">
                <div className="mb-6 pt-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">
                    Select Your Journey
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500 font-medium">
                    Choose the option that fits you best.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {roles.map((role) => (
                    <div 
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 bg-white hover:shadow-lg active:scale-[0.99] ${
                        role.id === 'customer' 
                          ? 'border-orange-300 hover:border-orange-500 bg-orange-50/20' 
                          : 'border-gray-100 hover:border-orange-400'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${role.color} flex items-center justify-center flex-shrink-0`}>
                        {role.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-extrabold text-gray-900 text-base mb-0.5">
                          {role.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-snug font-normal">
                          {role.desc}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200/80 flex items-center justify-center text-gray-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                        <ArrowRightOutlined className="text-xs" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-6 text-xs text-gray-500 font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="text-orange-500 font-extrabold hover:underline inline-flex items-center gap-1">
                    Sign In <ArrowRightOutlined className="text-[10px]" />
                  </Link>
                </div>
              </div>

              {/* Bottom Right Handwritten Callout */}
              <div className="absolute bottom-4 right-6 font-handwriting text-orange-500 text-base md:text-lg font-bold rotate-[-6deg] hidden md:block select-none pointer-events-none">
                Let's Build a Tastier Tomorrow!
              </div>
            </div>
          ) : (
            /* STEP 1: Detailed Registration Form */
            <div className="my-auto">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <button 
                    type="button" 
                    onClick={() => setStep(0)} 
                    className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                    title="Change selection"
                  >
                    <ArrowLeftOutlined className="text-sm" />
                  </button>
                  <h2 className="text-2xl font-extrabold text-gray-900">
                    {selectedRole === 'customer' 
                      ? 'Create Your Account' 
                      : selectedRole === 'restaurant' 
                        ? 'Join as a Restaurant' 
                        : 'Join as a Delivery Partner'}
                  </h2>
                </div>
                <p className="text-xs text-gray-500 font-medium ml-8">
                  {selectedRole === 'customer' 
                    ? 'Join Orderly and start exploring.' 
                    : 'Please provide your details to create your profile.'}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2.5 rounded-2xl mb-3 text-xs font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-2.5 rounded-2xl mb-3 text-xs font-medium">
                  {success}
                </div>
              )}

              <Formik
                initialValues={{
                  full_name: '',
                  email: '',
                  password: '',
                  confirm_password: '',
                  phone_number: '',
                  role: selectedRole,
                  name: '',
                  address: '',
                  business_license: '',
                  vehicle_license: '',
                  id_card: '',
                  vehicle_type: 'Motorcycle'
                }}
                validationSchema={RegisterSchema}
                enableReinitialize={true}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    setError('');
                    const response = await axios.post('/auth/register', values);
                    if (response.data.success) {
                      const data = response.data.data;
                      setSuccess('Registration successful! Redirecting to your dashboard...');
                      
                      if (data && data.token) {
                        dispatch(loginSuccess({
                          user: { 
                            id: data.id,
                            email: data.email, 
                            role: data.role,
                            full_name: data.full_name,
                            phone_number: data.phone_number
                          },
                          profile: data.profile,
                          token: data.token
                        }));

                        if (data.role?.toLowerCase() === 'customer') {
                          dispatch(fetchCart());
                        }
                      }

                      setTimeout(() => {
                        handleRedirect(data?.role || values.role);
                      }, 1200);
                    }
                  } catch (err) {
                    console.error('Registration error:', err.response?.data);
                    setError(err.response?.data?.message || 'Registration failed. Please check your details.');
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Full / Owner Name */}
                      <div className={selectedRole === 'customer' ? 'col-span-full' : 'col-span-1'}>
                        <div className="auth-input-container">
                          <UserOutlined className="auth-input-icon" />
                          <Field 
                            type="text" 
                            name="full_name" 
                            className="auth-input" 
                            placeholder={selectedRole === 'customer' ? 'Full Name' : 'Owner Name'} 
                          />
                        </div>
                        <ErrorMessage name="full_name" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                      </div>

                      {/* Phone Number */}
                      <div className={selectedRole === 'customer' ? 'col-span-full' : 'col-span-1'}>
                        <div className="auth-input-container">
                          <PhoneOutlined className="auth-input-icon" />
                          <Field 
                            type="text" 
                            name="phone_number" 
                            className="auth-input" 
                            placeholder="Phone Number" 
                          />
                        </div>
                        <ErrorMessage name="phone_number" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                      </div>

                      {/* Email Address */}
                      <div className="col-span-full">
                        <div className="auth-input-container">
                          <MailOutlined className="auth-input-icon" />
                          <Field 
                            type="email" 
                            name="email" 
                            className="auth-input" 
                            placeholder="Email Address" 
                          />
                        </div>
                        <ErrorMessage name="email" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                      </div>

                      {/* Password */}
                      <div className={selectedRole === 'customer' ? 'col-span-full' : 'col-span-1'}>
                        <div className="auth-input-container">
                          <LockOutlined className="auth-input-icon" />
                          <Field 
                            type={showPassword ? "text" : "password"} 
                            name="password" 
                            className="auth-input pr-10" 
                            placeholder="Password" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
                          >
                            {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          </button>
                        </div>
                        <ErrorMessage name="password" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                      </div>

                      {/* Confirm Password (For Partners) */}
                      {selectedRole !== 'customer' && (
                        <div className="col-span-1">
                          <div className="auth-input-container">
                            <LockOutlined className="auth-input-icon" />
                            <Field 
                              type={showConfirmPassword ? "text" : "password"} 
                              name="confirm_password" 
                              className="auth-input pr-10" 
                              placeholder="Confirm Password" 
                            />
                            <button 
                              type="button" 
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer"
                            >
                              {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            </button>
                          </div>
                          <ErrorMessage name="confirm_password" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                        </div>
                      )}

                      {/* Restaurant Specific Fields */}
                      {selectedRole === 'restaurant' && (
                        <>
                          <div className="col-span-1">
                            <div className="auth-input-container">
                              <ShopOutlined className="auth-input-icon" />
                              <Field 
                                type="text" 
                                name="name" 
                                className="auth-input" 
                                placeholder="Restaurant Name" 
                              />
                            </div>
                            <ErrorMessage name="name" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                          </div>

                          <div className="col-span-1">
                            <div className="auth-input-container">
                              <SafetyCertificateOutlined className="auth-input-icon" />
                              <Field 
                                type="text" 
                                name="business_license" 
                                className="auth-input" 
                                placeholder="Business License No." 
                              />
                            </div>
                            <ErrorMessage name="business_license" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                          </div>

                          <div className="col-span-full">
                            <div className="auth-input-container">
                              <EnvironmentOutlined className="auth-input-icon" />
                              <Field 
                                type="text" 
                                name="address" 
                                className="auth-input" 
                                placeholder="Full Restaurant Address" 
                              />
                            </div>
                            <ErrorMessage name="address" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                          </div>
                        </>
                      )}

                      {/* Delivery Partner Specific Fields */}
                      {selectedRole === 'delivery_partner' && (
                        <>
                          <div className="col-span-1">
                            <div className="auth-input-container">
                              <IdcardOutlined className="auth-input-icon" />
                              <Field 
                                type="text" 
                                name="id_card" 
                                className="auth-input" 
                                placeholder="Driver ID / National ID" 
                              />
                            </div>
                            <ErrorMessage name="id_card" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                          </div>

                          <div className="col-span-1">
                            <div className="auth-input-container">
                              <CarOutlined className="auth-input-icon" />
                              <Field 
                                type="text" 
                                name="vehicle_license" 
                                className="auth-input" 
                                placeholder="License Plate No." 
                              />
                            </div>
                            <ErrorMessage name="vehicle_license" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                          </div>

                          <div className="col-span-full">
                            <div className="auth-input-container">
                              <CarOutlined className="auth-input-icon" />
                              <Field 
                                as="select" 
                                name="vehicle_type" 
                                className="auth-input appearance-none cursor-pointer"
                              >
                                <option value="Motorcycle">Motorcycle</option>
                                <option value="Bicycle">Bicycle</option>
                                <option value="Car">Car / Delivery Van</option>
                              </Field>
                            </div>
                            <ErrorMessage name="vehicle_type" component="div" className="text-red-500 text-[11px] mt-0.5 ml-1 font-medium" />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Notice Box for Partners */}
                    {selectedRole !== 'customer' && (
                      <div className="auth-notice-box">
                        <strong>IMPORTANT:</strong> As a partner, your profile requires document verification by our team before you can start operations.
                      </div>
                    )}

                    {/* Submit Action Button */}
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="auth-btn-primary mt-2"
                    >
                      {isSubmitting ? 'Processing...' : (
                        <>
                          <span>
                            {selectedRole === 'customer' 
                              ? 'Create Account' 
                              : 'Complete Registration'}
                          </span>
                          <ArrowRightOutlined />
                        </>
                      )}
                    </button>

                    {/* Customer Social Sign-up */}
                    {selectedRole === 'customer' && (
                      <>
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200/80"></div>
                          </div>
                          <div className="relative flex justify-center text-[11px]">
                            <span className="px-3 bg-white text-gray-400 font-bold uppercase tracking-wider">
                              OR SIGN UP WITH
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button type="button" onClick={handleGoogleLogin} className="auth-social-btn">
                            <GoogleOutlined className="text-red-500 text-base" /> 
                            <span>Google</span>
                          </button>
                          <button type="button" className="auth-social-btn">
                            <FacebookFilled className="text-blue-600 text-base" /> 
                            <span>Facebook</span>
                          </button>
                        </div>
                      </>
                    )}

                    <div className="text-center pt-2 text-xs text-gray-500 font-medium">
                      Already have an account?{' '}
                      <Link to="/login" className="text-orange-500 font-extrabold hover:underline">
                        Sign In <ArrowRightOutlined className="text-[10px]" />
                      </Link>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

