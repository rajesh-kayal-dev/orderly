import React from "react";
import Link from "next/link";
import { Utensils, ShieldCheck, Zap, Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-slate-900 dark:text-white"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                <Utensils className="w-4 h-4" />
              </div>
              <span>
                Orderly<span className="text-amber-500">.</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Modern food delivery and restaurant management platform built with microservices and event-driven architecture.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/restaurants" className="hover:text-amber-500 transition-colors">
                  All Restaurants
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-amber-500 transition-colors">
                  My Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-amber-500 transition-colors">
                  Order Tracking
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture Highlights */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Architecture
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Identity & JWT Auth</span>
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Kafka Event Backbone</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Razorpay Payments</span>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/login" className="hover:text-amber-500 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-amber-500 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-amber-500 transition-colors">
                  User Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} Orderly System Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Rebuilt with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for performance and reliability
          </p>
        </div>
      </div>
    </footer>
  );
};
