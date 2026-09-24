import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../redux/slices/authSlice';
import { fetchCart } from '../../redux/slices/cartSlice';
import { Spin } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      const error = searchParams.get('error');
      const token = searchParams.get('token');
      const rawData = searchParams.get('data');

      if (error) {
        setStatus('error');
        setErrorMessage(decodeURIComponent(error));
        setTimeout(() => navigate('/login'), 3500);
        return;
      }

      if (!token || !rawData) {
        setStatus('error');
        setErrorMessage('Authentication data was not provided by the server.');
        setTimeout(() => navigate('/login'), 3500);
        return;
      }

      try {
        const parsedData = JSON.parse(decodeURIComponent(rawData));
        const user = parsedData.user || parsedData;
        const profile = parsedData.profile || null;

        dispatch(loginSuccess({
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
            phone_number: user.phone_number
          },
          profile,
          token
        }));

        if (user.role?.toLowerCase() === 'customer') {
          dispatch(fetchCart());
        }

        setStatus('success');

        // Redirect based on role
        setTimeout(() => {
          const role = user.role?.toLowerCase();
          if (role === 'admin') navigate('/admin');
          else if (role === 'restaurant') navigate('/restaurant');
          else if (role === 'delivery_partner') navigate('/delivery');
          else navigate('/customer');
        }, 800);
      } catch (err) {
        console.error('Failed to parse Google auth response:', err);
        setStatus('error');
        setErrorMessage('Failed to complete Google authentication.');
        setTimeout(() => navigate('/login'), 3500);
      }
    };

    handleAuth();
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100/50 p-4">
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-orange-100 max-w-md w-full text-center animate-scale-up">
        {status === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Spin size="large" />
            <h2 className="text-2xl font-black text-gray-800">Authenticating with Google...</h2>
            <p className="text-gray-500 text-sm">Please wait while we secure your Orderly session.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3 py-6 text-green-600 animate-slide-up">
            <CheckCircleOutlined className="text-5xl text-green-500" />
            <h2 className="text-2xl font-black text-gray-800">Sign-in Successful!</h2>
            <p className="text-gray-500 text-sm">Welcome to Orderly. Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6 text-red-600 animate-slide-up">
            <ExclamationCircleOutlined className="text-5xl text-red-500" />
            <h2 className="text-2xl font-black text-gray-800">Authentication Notice</h2>
            <p className="text-gray-600 text-sm max-w-xs">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Back to Sign In
            </button>
            <p className="text-gray-400 text-[11px] mt-1">Redirecting automatically in 3.5s...</p>
          </div>
        )}
      </div>
    </div>
  );
}
