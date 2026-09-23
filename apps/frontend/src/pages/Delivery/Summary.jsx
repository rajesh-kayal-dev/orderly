import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrophyOutlined, DollarOutlined, BarChartOutlined, SyncOutlined, LeftOutlined, RightOutlined, ShoppingOutlined } from '@ant-design/icons';

const DELIVERY_FEE_FALLBACK = 150;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function buildYearMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, year: d.getFullYear(), month: d.getMonth() });
  }
  return options;
}

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-md px-3.5 py-2 text-xs">
        <p className="font-bold text-slate-500 mb-0.5">Day {label}</p>
        <p className="text-[#FF521C] font-black">{payload[0].value} deliveries</p>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-md px-3.5 py-2 text-xs">
        <p className="font-bold text-slate-500 mb-0.5">Day {label}</p>
        <p className="text-emerald-600 font-black">₹{Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function DriverSummary() {
  const { profile, token } = useSelector(state => state.auth);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthOptions = useMemo(() => buildYearMonthOptions(), []);
  const [selectedOption, setSelectedOption] = useState(monthOptions[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/orders/driver/me/history');
        if (data.success) setHistory(data.data || []);
      } catch (err) {
        console.error('Error fetching driver history:', err);
      } finally {
        setLoading(false);
      }
    };
    if (profile?.id && token) fetchHistory();
    else setLoading(false);
  }, [profile, token]);

  // Filter by selected month
  const monthOrders = useMemo(() => {
    return history.filter(o => {
      const d = new Date(o.updated_at || o.createdAt);
      return d.getFullYear() === selectedOption.year && d.getMonth() === selectedOption.month;
    });
  }, [history, selectedOption]);

  // Build per-day chart data
  const chartData = useMemo(() => {
    const daysInMonth = new Date(selectedOption.year, selectedOption.month + 1, 0).getDate();
    const dayMap = {};

    monthOrders.forEach(o => {
      const day = new Date(o.updated_at || o.createdAt).getDate();
      const fee = parseFloat(o.delivery_fee || o.total_amount) || DELIVERY_FEE_FALLBACK;
      if (!dayMap[day]) dayMap[day] = { orders: 0, earnings: 0 };
      dayMap[day].orders += 1;
      dayMap[day].earnings += fee;
    });

    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      orders: dayMap[i + 1]?.orders || 0,
      earnings: dayMap[i + 1]?.earnings || 0,
    }));
  }, [monthOrders, selectedOption]);

  const totalOrders = monthOrders.length;
  const totalEarnings = monthOrders.reduce(
    (sum, o) => sum + (parseFloat(o.delivery_fee || o.total_amount) || DELIVERY_FEE_FALLBACK),
    0
  );
  const avgEarnings = totalOrders > 0 ? (totalEarnings / totalOrders).toFixed(0) : 0;

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center">
        <SyncOutlined spin className="text-2xl text-[#FF521C] mb-3 opacity-60" />
        <p className="font-bold text-slate-400 text-xs">Loading performance summary...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-4 text-slate-800">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            Earnings & Monthly Analytics
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Track your delivery performance, rewards, and daily trends
          </p>
        </div>

        {/* Month Selector Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl px-3.5 py-1.5 flex items-center gap-3 cursor-pointer transition-all shadow-2xs"
          >
            <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#FF521C] flex items-center justify-center text-xs font-bold">
              <BarChartOutlined />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 leading-none mb-0.5">Select Period</span>
              <span className="text-xs font-bold text-slate-800">{selectedOption.label}</span>
            </div>
            <SyncOutlined className={`ml-2 text-[10px] text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              ></div>
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-20 animate-fade-in">
                {/* Year Navigation */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <button 
                    onClick={() => {
                      const newYear = selectedOption.year - 1;
                      const opt = monthOptions.find(o => o.year === newYear && o.month === selectedOption.month) || { label: `${MONTH_NAMES[selectedOption.month]} ${newYear}`, year: newYear, month: selectedOption.month };
                      setSelectedOption(opt);
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                  >
                    <LeftOutlined className="text-[9px]" />
                  </button>
                  <span className="text-xs font-black text-slate-800">{selectedOption.year}</span>
                  <button 
                    onClick={() => {
                      const newYear = selectedOption.year + 1;
                      const opt = monthOptions.find(o => o.year === newYear && o.month === selectedOption.month) || { label: `${MONTH_NAMES[selectedOption.month]} ${newYear}`, year: newYear, month: selectedOption.month };
                      setSelectedOption(opt);
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                  >
                    <RightOutlined className="text-[9px]" />
                  </button>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_NAMES.map((m, idx) => {
                    const isActive = idx === selectedOption.month;
                    return (
                      <div 
                        key={m}
                        onClick={() => {
                          setSelectedOption({ label: `${m} ${selectedOption.year}`, year: selectedOption.year, month: idx });
                          setIsDropdownOpen(false);
                        }}
                        className={`py-2 rounded-xl text-center text-xs font-bold cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-[#FF521C] text-white shadow-2xs' 
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.slice(0, 3)}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed Deliveries</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalOrders}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{selectedOption.label}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF521C] flex items-center justify-center text-lg shadow-2xs shrink-0">
            <TrophyOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Earnings</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">₹{totalEarnings.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Delivery fees & bonuses</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <DollarOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Per Delivery</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">₹{avgEarnings}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Average payout rate</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
            <ShoppingOutlined />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Bar Chart — Orders per day */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Deliveries Per Day</h3>
              <p className="text-[10px] text-slate-400">{selectedOption.label}</p>
            </div>
          </div>

          {totalOrders === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-300 text-xs font-semibold">
              No delivery activity recorded for this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={12} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#FFF5EE', radius: 6 }} />
                <Bar dataKey="orders" fill="#FF521C" radius={[4, 4, 0, 0]} name="Deliveries" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Line Chart — Daily earnings */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Daily Earnings Trend</h3>
              <p className="text-[10px] text-slate-400">{selectedOption.label}</p>
            </div>
          </div>

          {totalOrders === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-300 text-xs font-semibold">
              No earnings recorded for this month.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `₹${v / 1000}k` : `₹${v}`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#10B981', strokeWidth: 0 }}
                  name="Earnings (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
