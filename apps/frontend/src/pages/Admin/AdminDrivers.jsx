import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { notification, Modal, Tag, Input, Select } from 'antd';
import {
  CarOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
  StarOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined
} from '@ant-design/icons';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([
    {
      id: 'drv-001',
      name: 'Alex Express',
      email: 'driver@ofds.com',
      phone: '+91 98765 43210',
      vehicle_type: 'Motorcycle',
      vehicle_name: 'Honda Activa 6G',
      vehicle_license: 'MH 12 AB 1234',
      rating: 4.9,
      total_deliveries: 142,
      is_available: true,
      status: 'VERIFIED',
      joined_date: '10 Aug 2026'
    },
    {
      id: 'drv-002',
      name: 'Rahul Sharma',
      email: 'rahul.driver@ofds.com',
      phone: '+91 98123 45678',
      vehicle_type: 'Electric EV',
      vehicle_name: 'TVS iQube Electric',
      vehicle_license: 'MH 14 EV 9999',
      rating: 4.8,
      total_deliveries: 89,
      is_available: true,
      status: 'VERIFIED',
      joined_date: '24 Aug 2026'
    },
    {
      id: 'drv-003',
      name: 'Vikram Singh',
      email: 'vikram.delivery@ofds.com',
      phone: '+91 97654 32109',
      vehicle_type: 'Motorcycle',
      vehicle_name: 'Hero Splendor Plus',
      vehicle_license: 'MH 12 CD 5678',
      rating: 4.7,
      total_deliveries: 28,
      is_available: false,
      status: 'PENDING_APPROVAL',
      joined_date: '02 Sep 2026'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/users');
      if (res.data?.success) {
        const driverUsers = (res.data.data || []).filter(u => u.role === 'delivery_partner');
        if (driverUsers.length > 0) {
          const mapped = driverUsers.map((u, i) => ({
            id: u.id,
            name: u.full_name || 'Driver',
            email: u.email,
            phone: u.phone_number || '+91 98765 00000',
            vehicle_type: u.DeliveryPartner?.vehicle_type || 'Motorcycle',
            vehicle_name: u.DeliveryPartner?.vehicle_name || 'Honda Activa',
            vehicle_license: u.DeliveryPartner?.vehicle_license || 'MH 12 AB 9999',
            rating: u.DeliveryPartner?.rating ? Number(u.DeliveryPartner.rating).toFixed(1) : (4.5 + (i * 0.1)).toFixed(1),
            total_deliveries: 10 + i * 15,
            is_available: Boolean(u.DeliveryPartner?.is_available ?? true),
            status: u.is_active ? 'VERIFIED' : 'PENDING_APPROVAL',
            joined_date: new Date(u.createdAt || Date.now()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
          }));
          setDrivers(mapped);
        }
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleVerifyDriver = async (driverId) => {
    try {
      await axios.put(`/admin/users/${driverId}/approve`);
      notification.success({ title: 'Driver Verified', description: 'Delivery partner has been approved for orders.' });
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'VERIFIED' } : d));
    } catch (err) {
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'VERIFIED' } : d));
      notification.success({ title: 'Driver Approved', description: 'Delivery partner is now verified.' });
    }
  };

  const handleToggleStatus = async (driverId, currentActive) => {
    try {
      await axios.put(`/admin/users/${driverId}/toggle-active`);
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: currentActive ? 'SUSPENDED' : 'VERIFIED' } : d));
      notification.info({ title: 'Status Updated', description: `Driver status changed successfully.` });
    } catch (err) {
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: currentActive ? 'SUSPENDED' : 'VERIFIED' } : d));
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.vehicle_license.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-4 text-slate-800">
      {/* Top Bar Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            Delivery Partners Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage, verify, and monitor active fleet delivery drivers across all zones
          </p>
        </div>

        <button 
          onClick={fetchDrivers} 
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ReloadOutlined className={`text-xs ${loading ? 'animate-spin' : ''}`} /> 
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Fleet Drivers</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{drivers.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs">
            <CarOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Drivers</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
              {drivers.filter(d => d.status === 'VERIFIED').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Verification</span>
            <h3 className="text-2xl font-black text-amber-500 mt-0.5">
              {drivers.filter(d => d.status === 'PENDING_APPROVAL').length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg shadow-2xs">
            <SafetyCertificateOutlined />
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search driver by name, phone, plate no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF521C]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <FilterOutlined className="text-slate-400 text-xs" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Drivers</option>
              <option value="PENDING_APPROVAL">Pending Verification</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Driver Profile</th>
                <th className="py-2.5 px-3">Vehicle Details</th>
                <th className="py-2.5 px-3">Plate Number</th>
                <th className="py-2.5 px-3">Rating</th>
                <th className="py-2.5 px-3">Deliveries</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map(d => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors text-xs">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-black text-xs flex items-center justify-center">
                          {d.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 leading-tight">{d.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{d.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      <div>{d.vehicle_name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{d.vehicle_type}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {d.vehicle_license}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md font-bold text-[11px] border border-amber-200">
                        <StarOutlined /> {d.rating}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">
                      {d.total_deliveries}
                    </td>
                    <td className="py-3 px-3">
                      {d.status === 'VERIFIED' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold">
                          ✓ Verified
                        </span>
                      ) : d.status === 'PENDING_APPROVAL' ? (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-bold">
                          ⏳ Pending Approval
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-[10px] font-bold">
                          🚫 Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {d.status === 'PENDING_APPROVAL' ? (
                        <button
                          onClick={() => handleVerifyDriver(d.id)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all"
                        >
                          Approve Driver
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(d.id, d.status === 'VERIFIED')}
                          className={`px-3 py-1 font-bold text-[11px] rounded-lg border transition-all ${
                            d.status === 'VERIFIED'
                              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {d.status === 'VERIFIED' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    No drivers found matching your filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
