import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import { InstagramOutlined, TwitterOutlined, FacebookOutlined, HeartFilled } from '@ant-design/icons';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white pt-14 pb-8 border-t border-neutral-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <BrandLogo variant="orange" size="md" />
            <p className="text-neutral-400 text-sm leading-relaxed">
              Delicious food delivered fast to your door. Fresh ingredients, hot meals, and top local restaurant partners.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Explore</h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li><Link to="/customer" className="hover:text-orange-400 transition-colors">Home</Link></li>
              <li><Link to="/customer/restaurants" className="hover:text-orange-400 transition-colors">All Restaurants</Link></li>
              <li><Link to="/customer/partners" className="hover:text-orange-400 transition-colors">Meet Our Partners</Link></li>
              <li><Link to="/customer/tracking" className="hover:text-orange-400 transition-colors">Track Orders</Link></li>
              <li><Link to="/customer/cart" className="hover:text-orange-400 transition-colors">Your Cart</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Customer Care</h4>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li><Link to="/customer/profile" className="hover:text-orange-400 transition-colors">My Profile</Link></li>
              <li><a href="#faq" className="hover:text-orange-400 transition-colors">Help & FAQ</a></li>
              <li><a href="#terms" className="hover:text-orange-400 transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide uppercase text-xs">Connect With Us</h4>
            <div className="flex gap-4 text-neutral-400 mb-6">
              <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all">
                <InstagramOutlined className="text-lg" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all">
                <TwitterOutlined className="text-lg" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-all">
                <FacebookOutlined className="text-lg" />
              </a>
            </div>
            <p className="text-xs text-neutral-500">
              Need assistance? Email support@orderly.com
            </p>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-neutral-500 gap-4">
          <p>© 2026 Orderly Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <HeartFilled className="text-orange-500 text-xs" /> for food lovers everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
