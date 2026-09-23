import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { resetCartState } from '../../redux/slices/cartSlice';
import BrandLogo from '../common/BrandLogo';

/* ─── Inline SVG icons matching the reference ─── */
const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);

const IconFork = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
  </svg>
);

const IconPartner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const IconMenu = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/>
  </svg>
);

const IconUser = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconProfile = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconBurger = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Navbar({ activeOrdersCount = 0 }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const cartCount = items.reduce((t, i) => t + (i.quantity || 1), 0);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetCartState());
    setDropdownOpen(false);
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/customer') return location.pathname === '/customer';
    return location.pathname.startsWith(path);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { name: 'Home',        path: '/customer',             icon: <IconHome /> },
    { name: 'Menu',        path: '/customer/menu',        icon: <IconMenu /> },
    { name: 'Restaurants', path: '/customer/restaurants', icon: <IconFork /> },
    { name: 'Partners',    path: '/customer/partners',    icon: <IconPartner /> },
    { name: 'Tracking',    path: '/customer/tracking',    icon: <IconClock />, badge: activeOrdersCount > 0 ? activeOrdersCount : null },
  ];

  const userName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-neutral-100 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <BrandLogo variant="orange" size="md" to="/customer" />

          {/* ── Desktop Nav Links (center) ── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    active
                      ? 'bg-orange-50 text-orange-500 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <span className={active ? 'text-orange-500' : 'text-neutral-400'}>{link.icon}</span>
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="ml-0.5 w-4 h-4 text-[10px] font-bold bg-orange-500 text-white rounded-full flex items-center justify-center">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Right: Cart + User Dropdown ── */}
          <div className="flex items-center gap-2">

            {/* Cart */}
            <Link
              to="/customer/cart"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all"
            >
              <IconCart />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 right-0 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all border border-transparent hover:border-neutral-200"
              >
                {/* Avatar circle */}
                <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                  <IconUser />
                </span>
                <span>{userName}</span>
                <span className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                  <IconChevron />
                </span>
              </button>

              {/* Dropdown Panel */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-100 rounded-2xl shadow-xl py-1 z-50 animate-fade-in">
                  <Link
                    to="/customer/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-neutral-400"><IconProfile /></span>
                    My Profile
                  </Link>
                  <div className="mx-3 border-t border-neutral-100" />
                  <Link
                    to="/customer/orders"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-neutral-400">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                        <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                      </svg>
                    </span>
                    My Orders
                  </Link>
                  <div className="mx-3 border-t border-neutral-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-neutral-400"><IconLogout /></span>
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <IconClose /> : <IconBurger />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white px-4 pt-3 pb-6 space-y-1 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-orange-50 text-orange-500 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive(link.path) ? 'text-orange-500' : 'text-neutral-400'}>{link.icon}</span>
                <span>{link.name}</span>
              </div>
              {link.badge && (
                <span className="w-5 h-5 text-[10px] font-bold bg-orange-500 text-white rounded-full flex items-center justify-center">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}

          <Link
            to="/customer/cart"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-neutral-400"><IconCart /></span>
              <span>Cart</span>
            </div>
            {cartCount > 0 && (
              <span className="w-5 h-5 text-[10px] font-bold bg-orange-500 text-white rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          <div className="pt-3 border-t border-neutral-100 space-y-1 mt-2">
            <Link
              to="/customer/profile"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <span className="text-neutral-400"><IconProfile /></span>
              <span>My Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <IconLogout />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
