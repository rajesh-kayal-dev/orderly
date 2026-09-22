import React from "react";
import Link from "next/link";
import { ArrowRight, Utensils, ShieldCheck, Zap, Star, Clock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";

const categories = [
  { name: "Burgers & Fast Food", icon: "🍔", tag: "Burgers" },
  { name: "Italian & Pizza", icon: "🍕", tag: "Pizza" },
  { name: "Asian & Noodles", icon: "🍜", tag: "Asian" },
  { name: "Healthy & Salads", icon: "🥗", tag: "Healthy" },
  { name: "Desserts & Bakery", icon: "🍰", tag: "Desserts" },
  { name: "Coffee & Drinks", icon: "☕", tag: "Beverages" },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 border border-slate-800 text-white p-8 sm:p-16 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Next-Gen Microservices Architecture
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Delicious food, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
              delivered on time.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
            Explore hundreds of handcrafted menus from top-rated restaurants near you. Fast ordering, live tracking, and seamless payments.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <Link href="/restaurants">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Browse Restaurants
              </Button>
            </Link>
            <Link href="/orders">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Track Orders
              </Button>
            </Link>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-left">
            <div>
              <div className="text-2xl font-extrabold text-white">30 min</div>
              <div className="text-xs text-slate-400">Average Delivery</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">4.8★</div>
              <div className="text-xs text-slate-400">Customer Rating</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">100%</div>
              <div className="text-xs text-slate-400">Secure Checkout</div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Popular Cuisines
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Find exactly what you are craving right now
            </p>
          </div>
          <Link
            href="/restaurants"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.tag}
              href={`/restaurants?cuisine=${encodeURIComponent(cat.tag)}`}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center hover:border-amber-500/40 hover:shadow-md transition-all hover:-translate-y-1 group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Platform Features */}
      <section className="rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12">
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Why Food Lovers Choose Orderly
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Engineered for high availability, transactional accuracy, and delightful dining experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Instant Order Processing
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Orders are immediately synced with restaurant kitchens using distributed event publishing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Live Delivery Updates
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Track your rider from pickup to your doorstep with real-time lifecycle tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Verified & Secure
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              JWT token security and tamper-proof Razorpay payment integration ensure safety.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}