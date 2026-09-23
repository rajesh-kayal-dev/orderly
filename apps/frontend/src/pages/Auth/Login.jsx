import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/slices/authSlice';
import { fetchCart } from '../../redux/slices/cartSlice';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { 
  MailOutlined, 
  LockOutlined, 
  GoogleOutlined, 
  FacebookFilled, 
  ArrowRightOutlined, 
  ExclamationCircleFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
  ShoppingOutlined,
  CarOutlined,
  SmileOutlined,
  SafetyCertificateOutlined,
  HeartOutlined
} from '@ant-design/icons';
import BrandLogo from '../../components/common/BrandLogo';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRedirect = (role) => {
    switch (role.toLowerCase()) {
      case 'customer': navigate('/customer'); break;
      case 'restaurant': navigate('/restaurant'); break;
      case 'delivery_partner': navigate('/delivery'); break;
      case 'admin': navigate('/admin'); break;
      default: navigate('/customer');
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-page-wrapper p-4 md:p-8">
      <div className="auth-card relative">
        
        {/* Left Hero Side (Warm Light Cream Panel) */}
        <div className="auth-illustration-light">
          {/* Top Handwritten Accent: Fresh Food ⤵ */}
          <div className="absolute top-6 right-6 font-handwriting text-orange-600 text-lg md:text-xl font-bold rotate-[-6deg] hidden lg:block select-none pointer-events-none">
            Fresh Food <span className="inline-block translate-y-1">⤵</span>
          </div>

          <div>
            <BrandLogo variant="orange" size="lg" to="/login" className="mb-6" />
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3 tracking-tight">
              Good Food <br />
              Brings People <br />
              <span className="text-orange-500">Together</span>
            </h1>
            
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-xs mb-6">
              Discover amazing food from your favorite local restaurants, delivered right to your door.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 max-w-xs mb-2">
              <div className="auth-feature-item-light">
                <div className="auth-feature-icon-light">
                  <ShoppingOutlined />
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-tight">Fresh & Delicious</h4>
                  <p className="text-[11px] text-gray-500">From top rated restaurants</p>
                </div>
              </div>

              <div className="auth-feature-item-light">
                <div className="auth-feature-icon-light">
                  <CarOutlined />
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-tight">Fast Delivery</h4>
                  <p className="text-[11px] text-gray-500">Right to your doorstep</p>
                </div>
              </div>

              <div className="auth-feature-item-light">
                <div className="auth-feature-icon-light">
                  <SmileOutlined />
                </div>
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-gray-900 leading-tight">Happy Customers</h4>
                  <p className="text-[11px] text-gray-500">Trusted by thousands</p>
                </div>
              </div>
            </div>

            {/* Middle Handwritten Accent: Great Taste ⤵ */}
            <div className="font-handwriting text-orange-600 text-lg md:text-xl font-bold rotate-[8deg] float-right mr-4 -mt-6 hidden lg:block select-none pointer-events-none">
              Great Taste <span className="inline-block translate-y-1">⤵</span>
            </div>
          </div>

          {/* Hero Image & Cursive Handwritten Tagline */}
          <div className="relative mt-2 flex flex-col items-start">
            <img 
              src="/brand_foods/band_with_burger.png" 
              alt="Orderly Burger" 
              className="w-full max-w-[290px] rounded-2xl object-cover drop-shadow-xl animate-float mx-auto md:mx-0"
            />
            <div className="font-handwriting text-2xl md:text-3xl text-orange-600 font-bold tracking-wide mt-1 rotate-[-4deg]">
              Good Food Brighter Days ~
            </div>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="auth-form-side">
          
          {/* Top Right Handwritten Accent: Welcome Back! \\ */}
          <div className="absolute top-4 right-6 font-handwriting text-orange-500 text-lg md:text-xl font-bold rotate-[6deg] hidden sm:block select-none pointer-events-none">
            Welcome Back! <span className="tracking-tighter">//</span>
          </div>

          <div className="mb-4 pt-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">Welcome Back!</h2>
            <p className="text-xs md:text-sm text-gray-500 font-medium">Sign in to continue your culinary journey.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-2xl mb-3 flex items-center gap-2.5 text-xs font-medium">
              <ExclamationCircleFilled className="text-base flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                setError('');
                const response = await axios.post('/auth/login', values);
                const { data } = response.data;
                let profileData = data.profile;

                if (data.role.toLowerCase() === 'restaurant' && !profileData) {
                  try {
                    const profileRes = await axios.get('/restaurants/my-profile', {
                      headers: { Authorization: `Bearer ${data.token}` }
                    });
                    profileData = profileRes.data.data;
                  } catch (profileErr) {
                    if (profileErr.response?.status === 404) {
                      try {
                        const createRes = await axios.post('/restaurants', {
                          name: data.full_name + "'s Restaurant"
                        }, { headers: { Authorization: `Bearer ${data.token}` } });
                        profileData = createRes.data.data;
                      } catch (createErr) {
                        console.error('Failed to auto-create restaurant profile:', createErr);
                      }
                    }
                  }
                }

                dispatch(loginSuccess({
                  user: { 
                    id: data.id,
                    email: data.email, 
                    role: data.role,
                    full_name: data.full_name,
                    phone_number: data.phone_number
                  },
                  profile: profileData,
                  token: data.token
                }));

                if (data.role.toLowerCase() === 'customer') {
                  dispatch(fetchCart());
                }

                handleRedirect(data.role);
              } catch (err) {
                setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-3.5 flex-1 flex flex-col justify-center">
                <div>
                  <div className="auth-input-container">
                    <MailOutlined className="auth-input-icon" />
                    <Field 
                      type="email" 
                      name="email" 
                      className="auth-input" 
                      placeholder="Email Address" 
                    />
                  </div>
                  <ErrorMessage name="email" component="div" className="text-red-500 text-[11px] mt-1 ml-1 font-medium" />
                </div>

                <div>
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
                  <ErrorMessage name="password" component="div" className="text-red-500 text-[11px] mt-1 ml-1 font-medium" />
                </div>

                <div className="flex justify-end">
                  <span className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline cursor-pointer">
                    Forgot Password?
                  </span>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="auth-btn-primary"
                >
                  {isSubmitting ? 'Signing In...' : (
                    <>
                      <span>Sign In</span>
                      <ArrowRightOutlined />
                    </>
                  )}
                </button>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200/80"></div>
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="px-3 bg-white text-gray-400 font-bold uppercase tracking-wider">
                      OR CONTINUE WITH
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

                <div className="text-center pt-2 text-xs text-gray-500 font-medium space-y-1">
                  <div>
                    Don't have an account?{' '}
                    <Link to="/register" className="text-orange-500 font-extrabold hover:underline inline-flex items-center gap-1">
                      Create Account <ArrowRightOutlined className="text-[10px]" />
                    </Link>
                  </div>
                  <div>
                    System Administrator?{' '}
                    <Link to="/admin/login" className="text-slate-600 font-bold hover:text-orange-500 hover:underline text-[11px]">
                      Admin Portal Login →
                    </Link>
                  </div>
                </div>

                {/* Bottom Trust Badges Row */}
                <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-100/90 mt-3">
                  <div className="auth-trust-badge">
                    <SafetyCertificateOutlined className="text-orange-500 text-sm flex-shrink-0" />
                    <div className="text-[10px] leading-tight">
                      <div className="font-bold text-gray-800">Secure</div>
                      <div className="text-gray-400 font-normal">& Private</div>
                    </div>
                  </div>
                  <div className="auth-trust-badge">
                    <CarOutlined className="text-orange-500 text-sm flex-shrink-0" />
                    <div className="text-[10px] leading-tight">
                      <div className="font-bold text-gray-800">Fast</div>
                      <div className="text-gray-400 font-normal">Delivery</div>
                    </div>
                  </div>
                  <div className="auth-trust-badge">
                    <HeartOutlined className="text-orange-500 text-sm flex-shrink-0" />
                    <div className="text-[10px] leading-tight">
                      <div className="font-bold text-gray-800">Loved by</div>
                      <div className="text-gray-400 font-normal">Foodies</div>
                    </div>
                  </div>
                </div>
              </Form>
            )}
          </Formik>

          {/* Bottom Right Handwritten Accent: Food Connects Us // */}
          <div className="absolute -bottom-8 right-2 font-handwriting text-orange-500 text-lg md:text-xl font-bold rotate-[-8deg] hidden md:block select-none pointer-events-none">
            Food Connects Us <span className="tracking-tighter">//</span>
          </div>
        </div>

      </div>
    </div>
  );
}


