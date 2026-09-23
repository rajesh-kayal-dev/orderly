import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from './api/axios';
import socket from './socket';
import { loginSuccess, logout as logoutAction } from './redux/slices/authSlice';
import { fetchCart, resetCartState } from './redux/slices/cartSlice';
import { setActiveCount, incrementActiveCount, decrementActiveCount } from './redux/slices/orderSlice';

// Layouts
import CustomerLayout from './components/layouts/CustomerLayout';
import RestaurantLayout from './components/layouts/RestaurantLayout';
import DeliveryLayout from './components/layouts/DeliveryLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Mock Pages
import CustomerDashboard from './pages/Customer/Dashboard';
import RestaurantList from './pages/Customer/RestaurantList';
import MenuList from './pages/Customer/MenuList';
import RestaurantMenu from './pages/Customer/RestaurantMenu';
import CartPage from './pages/Customer/CartPage';
import CheckoutPage from './pages/Customer/CheckoutPage';
import OrderTracking from './pages/Customer/OrderTracking';
import MyOrders from './pages/Customer/MyOrders';
import Partners from './pages/Customer/Partners';

import RestaurantDashboard from './pages/Restaurant/Dashboard';
import RestaurantOrders from './pages/Restaurant/Orders';
import MenuManagement from './pages/Restaurant/MenuManagement';
import RestaurantSummary from './pages/Restaurant/Summary';
import RestaurantReviews from './pages/Restaurant/Reviews';
import RestaurantPayouts from './pages/Restaurant/Payouts';
import RestaurantSettings from './pages/Restaurant/Settings';
import DeliveryDashboard from './pages/Delivery/Dashboard';
import DeliveryOrders from './pages/Delivery/Orders';
import DriverSummary from './pages/Delivery/Summary';
import DeliverySettings from './pages/Delivery/Settings';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminDrivers from './pages/Admin/AdminDrivers';
import AdminMenuCatalog from './pages/Admin/AdminMenuCatalog';
import AdminPayouts from './pages/Admin/AdminPayouts';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminSettings from './pages/Admin/AdminSettings';
import PendingApprovals from './pages/Admin/PendingApprovals';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Auth/Profile';
import AuthCallback from './pages/Auth/AuthCallback';
import AdminLogin from './pages/Auth/AdminLogin';

function App() {

  

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        try {
          const response = await axios.get('/auth/profile');
          if (response.data.success) {
            const data = response.data.data;
            // Determine which profile is active
            let profile = null;
            if (data.role === 'customer') profile = data.Customer;
            else if (data.role === 'delivery_partner') profile = data.DeliveryPartner;
            else if (data.role === 'admin') profile = data.Admin;
            else if (data.role === 'customer_support') profile = data.CustomerSupport;

            // Microservices: Fetch restaurant profile manually
            if (data.role === 'restaurant') {
              try {
                const profileRes = await axios.get('/restaurants/my-profile', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                profile = profileRes.data.data;
              } catch (profileErr) {
                if (profileErr.response?.status === 404) {
                    try {
                        const createRes = await axios.post('/restaurants', {
                          name: data.full_name + "'s Restaurant"
                        }, { headers: { Authorization: `Bearer ${token}` } });
                        profile = createRes.data.data;
                      } catch (createErr) {
                        console.error('Failed to auto-create restaurant profile:', createErr);
                      }
                } else {
                    console.error("Could not fetch restaurant profile", profileErr);
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
              profile: profile,
              token: token
            }));
            
            // Fetch cart from database once logged in
            if (data.role === 'customer') {
              dispatch(fetchCart());
            }
          }
        } catch (error) {
          console.error('Auto-login failed:', error);
          // If token is invalid, clear it
          if (error.response?.status === 401) {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('profile');
            dispatch(logoutAction());
            dispatch(resetCartState());
          }
        }
      }
    };

    fetchUser();

    // If user is already in session (from sessionStorage), fetch their cart on refresh
    if (token && user && user.role === 'customer') {
      dispatch(fetchCart());
    }
  }, [token, user, dispatch]);

  // Socket Connection Management
  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      console.log('Connected to real-time server');
      if (user && user.id) {
        socket.emit('join', user.id);
        
        // Drivers also join the available_deliveries room
        if (user.role === 'delivery_partner') {
          socket.emit('join_deliveries');
        }
      }
    };

    socket.on('connect', onConnect);

    return () => {
      socket.off('connect', onConnect);
      socket.disconnect();
    };
  }, []);



  // Global Order Socket Listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewOrder = (data) => {
      if (user.role === 'restaurant') {
        dispatch(incrementActiveCount());
      }
    };

    const handleAvailableDelivery = (data) => {
      if (user.role === 'delivery_partner') {
        dispatch(incrementActiveCount());
      }
    };

    const handleOrderAccepted = (data) => {
      if (user.role === 'delivery_partner') {
        // Someone took an order from the available pool
        dispatch(decrementActiveCount());
      }
    };

    const handleStatusUpdate = (data) => {
      if (user.role === 'restaurant') {
        if (data.status === 'preparing' || data.status === 'cancelled') {
          // Moved out of pending/accepted pool
          dispatch(decrementActiveCount());
        }
      } else if (user.role === 'delivery_partner') {
        if (data.status === 'delivered' || data.status === 'cancelled') {
          // Driver finished or order was cancelled while with driver
          dispatch(decrementActiveCount());
        } else if (data.status === 'picked_up') {
          // I just accepted an order! (Available pool decremented via ORDER_ACCEPTED, 
          // but now I increment for my active delivery)
          dispatch(incrementActiveCount());
        }
      }
    };

    socket.on('NEW_ORDER', handleNewOrder);
    socket.on('AVAILABLE_DELIVERY', handleAvailableDelivery);
    socket.on('ORDER_ACCEPTED', handleOrderAccepted);
    socket.on('ORDER_STATUS_UPDATED', handleStatusUpdate);

    return () => {
      socket.off('NEW_ORDER', handleNewOrder);
      socket.off('AVAILABLE_DELIVERY', handleAvailableDelivery);
      socket.off('ORDER_ACCEPTED', handleOrderAccepted);
      socket.off('ORDER_STATUS_UPDATED', handleStatusUpdate);
    };
  }, [isAuthenticated, user?.role, dispatch]);

  const location = useLocation();

  // Dynamic Browser Document Title Update
  useEffect(() => {
    const path = location.pathname;
    let title = 'Orderly';

    // Auth Routes
    if (path === '/login') title = 'Login';
    else if (path === '/admin/login' || path === '/admin-login') title = 'Admin Portal Login';
    else if (path === '/register') title = 'Create Account';
    else if (path === '/auth/callback') title = 'Authenticating';

    // Customer Routes
    else if (path === '/customer') title = 'Home';
    else if (path === '/customer/menu') title = 'Explore Menu';
    else if (path === '/customer/restaurants') title = 'Restaurants';
    else if (path.startsWith('/customer/restaurant/')) title = 'Restaurant Menu';
    else if (path === '/customer/partners') title = 'Delivery Partners';
    else if (path === '/customer/cart') title = 'Your Cart';
    else if (path === '/customer/checkout') title = 'Checkout';
    else if (path === '/customer/tracking') title = 'Order Tracking';
    else if (path === '/customer/orders') title = 'My Orders';
    else if (path === '/customer/profile') title = 'My Profile';

    // Restaurant Routes
    else if (path === '/restaurant') title = 'Restaurant Dashboard';
    else if (path === '/restaurant/menu') title = 'Menu Management';
    else if (path === '/restaurant/orders') title = 'Kitchen Orders';
    else if (path === '/restaurant/summary') title = 'Restaurant Reports';
    else if (path === '/restaurant/reviews') title = 'Customer Reviews';
    else if (path === '/restaurant/payouts') title = 'Restaurant Payouts';
    else if (path === '/restaurant/settings') title = 'Restaurant Settings';
    else if (path === '/restaurant/profile') title = 'Restaurant Profile';

    // Delivery Routes
    else if (path === '/delivery') title = 'Delivery Dashboard';
    else if (path === '/delivery/orders') title = 'Available Deliveries';
    else if (path === '/delivery/summary') title = 'Earnings Summary';
    else if (path === '/delivery/map') title = 'Live Map Tracking';
    else if (path === '/delivery/settings') title = 'Driver Settings';
    else if (path === '/delivery/profile') title = 'Driver Profile';

    // Admin Routes
    else if (path === '/admin') title = 'Admin Dashboard';
    else if (path === '/admin/orders') title = 'Platform Orders';
    else if (path === '/admin/users') title = 'User Management';
    else if (path === '/admin/drivers') title = 'Driver Management';
    else if (path === '/admin/menu') title = 'Menu Catalog';
    else if (path === '/admin/payouts') title = 'Payout Management';
    else if (path === '/admin/analytics') title = 'Platform Analytics';
    else if (path === '/admin/settings') title = 'Platform Settings';
    else if (path === '/admin/pending-approvals') title = 'Partner Approvals';
    else if (path === '/admin/profile') title = 'Admin Profile';

    document.title = title;
  }, [location]);

  // Handle User Room Joining when auth state changes
  useEffect(() => {
    if (socket.connected && user && user.id) {
      socket.emit('join', user.id);
      if (user.role === 'delivery_partner') {
        socket.emit('join_deliveries');
      }
    }
  }, [user]);

  return (
    <div className="font-sans bg-background min-h-screen text-textMain">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/partners" element={<Navigate to="/customer/partners" replace />} />

        {/* Customer Routes */}
        <Route path="/customer" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="menu" element={<MenuList />} />
          <Route path="restaurants" element={<RestaurantList />} />
          <Route path="restaurant/:restaurantId" element={<RestaurantMenu />} />
          <Route path="partners" element={<Partners />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="tracking" element={<OrderTracking />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Restaurant Routes */}
        <Route path="/restaurant" element={<RestaurantLayout />}>
          <Route index element={<RestaurantDashboard />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="orders" element={<RestaurantOrders />} />
          <Route path="summary" element={<RestaurantSummary />} />
          <Route path="reviews" element={<RestaurantReviews />} />
          <Route path="payouts" element={<RestaurantPayouts />} />
          <Route path="settings" element={<RestaurantSettings />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Delivery Routes */}
        <Route path="/delivery" element={<DeliveryLayout />}>
          <Route index element={<DeliveryDashboard />} />
          <Route path="orders" element={<DeliveryOrders />} />
          <Route path="summary" element={<DriverSummary />} />
          <Route path="map" element={<div>Google Maps Tracking</div>} />
          <Route path="settings" element={<DeliverySettings />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="menu" element={<AdminMenuCatalog />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="pending-approvals" element={<PendingApprovals />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        

        {/* Default route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
