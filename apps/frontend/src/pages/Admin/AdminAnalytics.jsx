import React, { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  BarChartOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  CalendarOutlined
} from '@ant-design/icons';

export default function AdminAnalytics() {
  const [timeframe, setTimeframe] = useState('7d');

  // Revenue & Order Data
  const monthlyRevenueData = [
    { month: 'Apr', revenue: 120000, orders: 450 },
    { month: 'May', revenue: 185000, orders: 620 },
    { month: 'Jun', revenue: 240000, orders: 810 },
    { month: 'Jul', revenue: 310000, orders: 1100 },
    { month: 'Aug', revenue: 420000, orders: 1450 },
    { month: 'Sep', revenue: 580000, orders: 1980 },
  ];

  // Peak Hourly Traffic
  const hourlyTrafficData = [
    { hour: '11 AM', orders: 45 },
    { hour: '12 PM', orders: 120 },
    { hour: '1 PM', orders: 195 },
    { hour: '2 PM', orders: 140 },
    { hour: '5 PM', orders: 60 },
    { hour: '7 PM', orders: 220 },
    { hour: '8 PM', orders: 310 },
    { hour: '9 PM', orders: 260 },
    { hour: '10 PM', orders: 110 },
  ];

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-4 text-slate-800">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            Platform Analytics & Executive Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Gross merchandise value (GMV), order velocity, peak hour traffic & revenue trends
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700">
          {['7d', '30d', '90d', '1y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg transition-all ${timeframe === tf ? 'bg-[#FF521C] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Revenue (GMV)</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">₹5,80,000</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +38% vs last month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs">
            <span className="font-bold text-base">₹</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Delivered Orders</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">1,980</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +24% vs last month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF521C] flex items-center justify-center text-lg shadow-2xs">
            <ShoppingOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Order Value (AOV)</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">₹292</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">↑ +4.2% optimization</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs">
            <BarChartOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Delivery Time</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">24.5 min</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">⚡ Fast delivery SLA</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg shadow-2xs">
            <ClockCircleOutlined />
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Monthly Revenue Trend Area Chart */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Monthly Revenue Growth (₹)</h3>
            <p className="text-[10px] text-slate-400">Track gross platform merchandise value</p>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenueData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hourly Traffic Bar Chart */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Peak Hour Order Traffic</h3>
            <p className="text-[10px] text-slate-400">Order distribution across lunch and dinner rush hours</p>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyTrafficData} barSize={16} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#FFF3EC' }} />
              <Bar dataKey="orders" fill="#FF521C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
