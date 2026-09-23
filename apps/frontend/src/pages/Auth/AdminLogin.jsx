import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../api/axios';
import { 
  SafetyCertificateOutlined, 
  LockOutlined, 
  MailOutlined, 
  ArrowRightOutlined, 
  ExclamationCircleFilled,
  EyeOutlined,
  EyeInvisibleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import BrandLogo from '../../components/common/BrandLogo';

const AdminLoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Admin email is required'),
  password: Yup.string().required('Password is required'),
});

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Auto-redirect to /admin if already authenticated as Admin
  React.useEffect(() => {
    if (isAuthenticated && user?.role?.toLowerCase() === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF521C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Admin Authorization Card */}
      <div className="w-full max-w-md bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF521C]/15 border border-[#FF521C]/30 text-[#FF521C] text-[11px] font-black uppercase tracking-wider">
            <SafetyCertificateOutlined className="text-xs" />
            <span>Enterprise Admin Portal</span>
          </div>

          <div className="flex justify-center pt-2">
            <BrandLogo variant="orange" size="lg" to="/admin/login" />
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight pt-1">
            Admin Console Login
          </h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            Authorized personnel only. Authenticate with your master administrator credentials.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-500/10 border-l-4 border-rose-500 text-rose-300 p-3 rounded-xl text-xs font-medium flex items-center gap-2.5">
            <ExclamationCircleFilled className="text-base shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Formik Form */}
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={AdminLoginSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              setError('');
              const response = await axios.post('/auth/login', values);
              const { data } = response.data;

              // Strictly enforce admin role verification
              if (data.role?.toLowerCase() !== 'admin') {
                setError('Access Denied: Admin privileges required to access this portal.');
                setSubmitting(false);
                return;
              }

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

              navigate('/admin', { replace: true });
            } catch (err) {
              setError(err.response?.data?.message || 'Authentication failed. Please verify admin credentials.');
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, setFieldValue }) => (
            <Form className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <MailOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Field
                    type="email"
                    name="email"
                    placeholder="admin@ofds.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-[#FF521C] transition-colors"
                  />
                </div>
                <ErrorMessage name="email" component="div" className="text-rose-400 text-[11px] font-bold mt-1" />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Master Password
                </label>
                <div className="relative">
                  <LockOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Field
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-[#FF521C] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
                <ErrorMessage name="password" component="div" className="text-rose-400 text-[11px] font-bold mt-1" />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Authenticate Admin Access'}</span>
                <ArrowRightOutlined className="text-xs" />
              </button>

              {/* Quick Demo Fill Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue('email', import.meta.env.VITE_ADMIN_EMAIL || 'admin@ofds.com');
                    setFieldValue('password', import.meta.env.VITE_ADMIN_PASSWORD || 'password123');
                  }}
                  className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ThunderboltOutlined className="text-amber-400" />
                  <span>Fill Admin Credentials ({import.meta.env.VITE_ADMIN_EMAIL || 'admin@ofds.com'})</span>
                </button>
              </div>

              {/* Back to User Login Link */}
              <div className="text-center pt-2 text-xs text-slate-500 font-medium">
                Not an Admin?{' '}
                <Link to="/login" className="text-[#FF521C] font-bold hover:underline">
                  Customer & Partner Login →
                </Link>
              </div>
            </Form>
          )}
        </Formik>

        {/* Footer Security Badge */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-medium">
          <SafetyCertificateOutlined className="text-emerald-500 text-xs" />
          <span>256-bit Encrypted Session • Audit Logging Active</span>
        </div>

      </div>
    </div>
  );
}
