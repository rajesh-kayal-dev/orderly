import React, { useState } from 'react';
import { notification, Switch } from 'antd';
import {
  SettingOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  LockOutlined,
  SlidersOutlined
} from '@ant-design/icons';

export default function AdminSettings() {
  const [commissionRate, setCommissionRate] = useState('15');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState('40');
  const [dispatchRadius, setDispatchRadius] = useState('5');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApprovePartners, setAutoApprovePartners] = useState(true);
  const [socketBroadcasting, setSocketBroadcasting] = useState(true);

  const handleSaveSettings = () => {
    notification.success({
      title: 'Platform Settings Saved',
      description: 'Global commission rates, dispatch rules, and system toggles have been updated.',
      placement: 'topRight'
    });
  };

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-4 text-slate-800">
      {/* Top Bar Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF521C] flex items-center justify-center text-xl shadow-2xs">
            <SettingOutlined />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              Global Platform Configuration & System Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Configure commissions, dispatch parameters, system toggles & regional settings
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="bg-[#FF521C] hover:bg-[#E04310] active:scale-98 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Save Changes ✓</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: Financial & Dispatch Rules */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Section 1: Financial & Commission Rules */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <DollarOutlined className="text-[#FF521C] text-base" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. Platform Fee & Commission Structure
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Standard Restaurant Commission (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Base Customer Delivery Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={baseDeliveryFee}
                    onChange={(e) => setBaseDeliveryFee(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Dispatch & Operating Distance Rules */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <ThunderboltOutlined className="text-amber-500 text-base" />
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. Order Dispatch & Matching Engine
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Max Initial Dispatch Radius (KM)</label>
                <input
                  type="number"
                  value={dispatchRadius}
                  onChange={(e) => setDispatchRadius(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-[#FF521C]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Default Platform Currency & Zone</label>
                <input
                  type="text"
                  value="INR (₹) • IST Asia/Kolkata"
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200/80 rounded-xl font-semibold text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: System Toggles & Emergency Controls */}
        <div className="space-y-4">
          
          {/* Automation & Emergency Toggles */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <SlidersOutlined className="text-blue-500 text-base" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                System Control Toggles
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Partner Auto-Approve */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">Instant Partner Activation</p>
                  <p className="text-[10px] text-slate-500">Auto approve registered partners</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoApprovePartners(!autoApprovePartners)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                    autoApprovePartners ? 'bg-[#FF521C]' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                    autoApprovePartners ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Socket Real-Time Server */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900">Real-Time Socket Events</p>
                  <p className="text-[10px] text-slate-500">Enable order broadcasts</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSocketBroadcasting(!socketBroadcasting)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                    socketBroadcasting ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                    socketBroadcasting ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                <div>
                  <p className="font-bold text-rose-900">System Maintenance Mode</p>
                  <p className="text-[10px] text-rose-600 font-medium">Pause customer ordering</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-10 h-5 rounded-full transition-colors relative flex items-center ${
                    maintenanceMode ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
                    maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* System Info Card */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs space-y-2 text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Core Engine</span>
              <span className="font-bold text-orange-400">Orderly v2.4 (Microservices)</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Database</span>
              <span className="font-bold text-emerald-400 font-mono">Neon PostgreSQL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gateway Status</span>
              <span className="font-bold text-blue-400">🟢 Operational (Port 8000)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
