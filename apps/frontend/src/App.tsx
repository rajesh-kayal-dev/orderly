import React, { useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { apiClient } from './api/client';
import socket from './socket';
import { loginSuccess, logout as logoutAction, setAuthInitialized } from './redux/slices/authSlice';
import { fetchCart, resetCartState } from './redux/slices/cartSlice';
import { incrementActiveCount, decrementActiveCount } from './redux/slices/orderSlice';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layouts
import CustomerLayout from './components/layouts/CustomerLayout';
import RestaurantLayout from './components/layouts/RestaurantLayout';
import DeliveryLayout from './components/layouts/DeliveryLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Customer Pages
import CustomerDashboard from './pages/Customer/Dashboard';
import RestaurantList from './pages/Customer/RestaurantList';
import MenuList from './pages/Customer/MenuList';
import RestaurantMenu from './pages/Customer/RestaurantMenu';
import CartPage from './pages/Customer/CartPage';
import CheckoutPage from './pages/Customer/CheckoutPage';
import OrderTracking from './pages/Customer/OrderTracking';
import MyOrders from './pages/Customer/MyOrders';
import Partners from './pages/Customer/Partners';

// Restaurant Pages
import RestaurantDashboard from './pages/Restaurant/Dashboard';
import RestaurantOrders from './pages/Restaurant/Orders';
import MenuManagement from './pages/Restaurant/MenuManagement';
import RestaurantSummary from './pages/Restaurant/Summary';
import RestaurantReviews from './pages/Restaurant/Reviews';
import RestaurantPayouts from './pages/Restaurant/Payouts';
import RestaurantSettings from './pages/Restaurant/Settings';

// Delivery Pages
import DeliveryDashboard from './pages/Delivery/Dashboard';
import DeliveryOrders from './pages/Delivery/Orders';
import DriverSummary from './pages/Delivery/Summary';
import DeliverySettings from './pages/Delivery/Settings';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminRestaurants from './pages/Admin/AdminRestaurants';
import AdminDrivers from './pages/Admin/AdminDrivers';
import AdminFeedback from './pages/Admin/AdminFeedback';
import AdminMenuCatalog from './pages/Admin/AdminMenuCatalog';
import AdminPayouts from './pages/Admin/AdminPayouts';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminSettings from './pages/Admin/AdminSettings';
import PendingApprovals from './pages/Admin/PendingApprovals';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Profile from './pages/Auth/Profile';
import AuthCallback from './pages/Auth/AuthCallback';
import AdminLogin from './pages/Auth/AdminLogin';

/**
 * Clean Orderly Loading Screen during Auth Resolution
 */
export const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center text-white font-sans p-4">
    <div className="relative w-14 h-14 mb-5">
      <div className="absolute inset-0 rounded-full border-4 border-orange-500/20 animate-ping" />
      <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
    <div className="text-xl font-black text-slate-100 tracking-tight">Orderly</div>
    <div className="text-xs text-slate-400 mt-1 font-medium">Securing session & loading workspace...</div>
  </div>
);

/**
 * Role-aware Root Route Handler:
 * If authLoading -> show loading state
 * If authenticated:
 *   - restaurant -> redirect to /restaurant
 *   - delivery_partner / delivery -> redirect to /delivery
 *   - admin / customer_support -> redirect to /admin
 *   - customer -> redirect to /customer
 * If unauthenticated / logged out:
 *   - Render public home page directly at "/" (URL remains http://localhost:3000/)
 */
const RootRouteHandler: React.FC = () => {
  const { user, isAuthenticated, authInitialized } = useSelector((state: any) => state.auth);

  if (!authInitialized) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && user) {
    const role = (user.role || '').toLowerCase();
    if (role === 'restaurant') return <Navigate to="/restaurant" replace />;
    if (role === 'delivery_partner' || role === 'delivery') return <Navigate to="/delivery" replace />;
    if (role === 'admin' || role === 'customer_support') return <Navigate to="/admin" replace />;
    return <Navigate to="/customer" replace />;
  }

  // Unauthenticated / logged-out visitors remain on public "/" route
  return (
    <CustomerLayout>
      <CustomerDashboard />
    </CustomerLayout>
  );
};

/**
 * CustomerIndexGuard:
 * Guards visiting "/customer" directly:
 * If unauthenticated -> redirect to "/" (root public home)
 * If authenticated -> render CustomerDashboard
 */
const CustomerIndexGuard: React.FC = () => {
  const { user, isAuthenticated, authInitialized } = useSelector((state: any) => state.auth);

  if (!authInitialized) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  return <CustomerDashboard />;
};

/**
 * RoleRoute: Guards protected routes based on authenticated role
 */
interface RoleRouteProps {
  allowedRoles: string[];
  children?: React.ReactNode;
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, authInitialized } = useSelector((state: any) => state.auth);

  if (!authInitialized) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    if (allowedRoles.includes('admin') || allowedRoles.includes('customer_support')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  if (!normalizedAllowed.includes(userRole)) {
    if (userRole === 'restaurant') return <Navigate to="/restaurant" replace />;
    if (userRole === 'delivery_partner' || userRole === 'delivery') return <Navigate to="/delivery" replace />;
    if (userRole === 'admin' || userRole === 'customer_support') return <Navigate to="/admin" replace />;
    return <Navigate to="/customer" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const App: React.FC = () => {
  const { user, isAuthenticated, token } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch<any>();
  const location = useLocation();

  const initAuth = useCallback(async () => {
    const activeToken =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') || sessionStorage.getItem('token')
        : null;

    if (!activeToken || activeToken === 'undefined' || activeToken === 'null') {
      dispatch(setAuthInitialized({ status: 'unauthenticated' }));
      return;
    }

    try {
      const response = await apiClient.get('/auth/profile', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      if (response.data?.success) {
        const data = response.data.data;

        // Verify account status (handle suspension / blocking)
        if (
          data.status === 'suspended' ||
          data.status === 'blocked' ||
          data.status === 'deleted'
        ) {
          console.warn('Account is suspended or blocked:', data.email);
          dispatch(logoutAction());
          dispatch(resetCartState());
          dispatch(setAuthInitialized({ status: 'unauthenticated' }));
          return;
        }

        let profile: any = null;
        if (data.role === 'customer') profile = data.Customer;
        else if (data.role === 'delivery_partner') profile = data.DeliveryPartner;
        else if (data.role === 'admin') profile = data.Admin;
        else if (data.role === 'customer_support') profile = data.CustomerSupport;

        if (data.role === 'restaurant') {
          try {
            const profileRes = await apiClient.get('/restaurants/my-profile', {
              headers: { Authorization: `Bearer ${activeToken}` },
            });
            profile = profileRes.data.data;
          } catch (profileErr: any) {
            if (profileErr.response?.status === 404) {
              try {
                const createRes = await apiClient.post(
                  '/restaurants',
                  { name: `${data.full_name}'s Restaurant` },
                  { headers: { Authorization: `Bearer ${activeToken}` } }
                );
                profile = createRes.data.data;
              } catch (createErr) {
                console.error('Failed to auto-create restaurant profile:', createErr);
              }
            }
          }
        }

        dispatch(
          loginSuccess({
            user: {
              id: data.id,
              email: data.email,
              role: data.role,
              full_name: data.full_name,
              phone_number: data.phone_number,
            },
            profile,
            token: activeToken,
          })
        );

        if (data.role === 'customer') {
          dispatch(fetchCart());
        }
      } else {
        dispatch(logoutAction());
        dispatch(setAuthInitialized({ status: 'unauthenticated' }));
      }
    } catch (error: any) {
      console.warn('Auth session verification notice:', error?.response?.data || error?.message);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        dispatch(logoutAction());
        dispatch(resetCartState());
        dispatch(setAuthInitialized({ status: 'unauthenticated' }));
      } else {
        // Network or transient server error, maintain stored state but mark initialized
        dispatch(setAuthInitialized());
      }
    }
  }, [dispatch]);

  // Initial Auth Lifecycle
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Multi-Tab Storage Synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (!e.newValue || e.newValue === 'null' || e.newValue === 'undefined') {
          // Another tab logged out
          dispatch(logoutAction());
          dispatch(resetCartState());
        } else if (e.newValue !== token) {
          // Another tab logged in
          initAuth();
        }
      } else if (e.key === 'user' && !e.newValue) {
        dispatch(logoutAction());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [token, initAuth, dispatch]);

  // Socket Connection Management
  useEffect(() => {
    try {
      socket.connect();
      const onConnect = () => {
        if (user && user.id) {
          socket.emit('join', user.id);
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
    } catch (e) {
      // Socket optional fallback
    }
  }, [user]);

  // Global Order Socket Listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNewOrder = () => {
      if (user?.role === 'restaurant') {
        dispatch(incrementActiveCount());
      }
    };

    const handleAvailableDelivery = () => {
      if (user?.role === 'delivery_partner') {
        dispatch(incrementActiveCount());
      }
    };

    const handleOrderAccepted = () => {
      if (user?.role === 'delivery_partner') {
        dispatch(decrementActiveCount());
      }
    };

    const handleStatusUpdate = (data: any) => {
      if (user?.role === 'restaurant') {
        if (data.status === 'preparing' || data.status === 'cancelled') {
          dispatch(decrementActiveCount());
        }
      } else if (user?.role === 'delivery_partner') {
        if (data.status === 'delivered' || data.status === 'cancelled') {
          dispatch(decrementActiveCount());
        } else if (data.status === 'picked_up') {
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

  // Dynamic Browser Document Title
  useEffect(() => {
    const path = location.pathname;
    let title = 'Orderly';

    if (path === '/login') title = 'Login';
    else if (path === '/admin/login' || path === '/admin-login') title = 'Admin Portal Login';
    else if (path === '/register') title = 'Create Account';
    else if (path === '/auth/callback') title = 'Authenticating';
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
    else if (path === '/restaurant') title = 'Restaurant Dashboard';
    else if (path === '/restaurant/menu') title = 'Menu Management';
    else if (path === '/restaurant/orders') title = 'Kitchen Orders';
    else if (path === '/restaurant/summary') title = 'Restaurant Reports';
    else if (path === '/restaurant/reviews' || path === '/restaurant/feedback') title = 'Customer Feedback';
    else if (path === '/restaurant/payouts') title = 'Restaurant Payouts';
    else if (path === '/restaurant/settings') title = 'Restaurant Settings';
    else if (path === '/restaurant/profile') title = 'Restaurant Profile';
    else if (path === '/delivery') title = 'Delivery Dashboard';
    else if (path === '/delivery/orders') title = 'Available Deliveries';
    else if (path === '/delivery/summary') title = 'Earnings Summary';
    else if (path === '/delivery/map') title = 'Live Map Tracking';
    else if (path === '/delivery/settings') title = 'Driver Settings';
    else if (path === '/delivery/profile') title = 'Driver Profile';
    else if (path === '/admin') title = 'Admin Dashboard';
    else if (path === '/admin/orders') title = 'Platform Orders';
    else if (path === '/admin/users') title = 'User Management';
    else if (path === '/admin/restaurants') title = 'Restaurant Management';
    else if (path === '/admin/drivers') title = 'Driver Management';
    else if (path === '/admin/feedback') title = 'Customer Feedback';
    else if (path === '/admin/menu') title = 'Menu Catalog';
    else if (path === '/admin/payouts') title = 'Payout Management';
    else if (path === '/admin/analytics') title = 'Platform Analytics';
    else if (path === '/admin/settings') title = 'Platform Settings';
    else if (path === '/admin/pending-approvals') title = 'Partner Approvals';
    else if (path === '/admin/profile') title = 'Admin Profile';

    document.title = title;
  }, [location]);

  return (
    <ErrorBoundary>
      <div className="font-sans bg-background min-h-screen text-textMain">
        <Routes>
          {/* Role-aware Root Route */}
          <Route path="/" element={<RootRouteHandler />} />

          {/* Top-level public aliases */}
          <Route path="/menu" element={<Navigate to="/customer/menu" replace />} />
          <Route path="/restaurants" element={<Navigate to="/customer/restaurants" replace />} />
          <Route path="/partners" element={<Navigate to="/customer/partners" replace />} />
          <Route path="/cart" element={<Navigate to="/customer/cart" replace />} />
          <Route path="/tracking" element={<Navigate to="/customer/tracking" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Customer Routes (Publicly Accessible & Authenticated Customer Experience) */}
          <Route path="/customer" element={<CustomerLayout />}>
            <Route index element={<CustomerIndexGuard />} />
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

          {/* Restaurant Routes (Protected) */}
          <Route
            path="/restaurant"
            element={
              <RoleRoute allowedRoles={['restaurant']}>
                <RestaurantLayout />
              </RoleRoute>
            }
          >
            <Route index element={<RestaurantDashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="orders" element={<RestaurantOrders />} />
            <Route path="summary" element={<RestaurantSummary />} />
            <Route path="reviews" element={<RestaurantReviews />} />
            <Route path="feedback" element={<RestaurantReviews />} />
            <Route path="payouts" element={<RestaurantPayouts />} />
            <Route path="settings" element={<RestaurantSettings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Delivery Routes (Protected) */}
          <Route
            path="/delivery"
            element={
              <RoleRoute allowedRoles={['delivery_partner', 'delivery']}>
                <DeliveryLayout />
              </RoleRoute>
            }
          >
            <Route index element={<DeliveryDashboard />} />
            <Route path="orders" element={<DeliveryOrders />} />
            <Route path="summary" element={<DriverSummary />} />
            <Route path="map" element={<div className="p-8 text-neutral-500">Live Delivery Route Map</div>} />
            <Route path="settings" element={<DeliverySettings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin Routes (Protected) */}
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={['admin', 'customer_support']}>
                <AdminLayout />
              </RoleRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="restaurants" element={<AdminRestaurants />} />
            <Route path="drivers" element={<AdminDrivers />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="menu" element={<AdminMenuCatalog />} />
            <Route path="payouts" element={<AdminPayouts />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="pending-approvals" element={<PendingApprovals />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Default fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
};

export default App;
