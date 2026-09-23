import React, { useState } from 'react';
import axios from '../../api/axios';
import { notification, Tag, Modal } from 'antd';
import {
  WalletOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  CarOutlined,
  BankOutlined,
  ReloadOutlined,
  FilterOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState([
    {
      id: 'PAY-8901',
      recipient_name: 'Orderly Gourmet Hub',
      recipient_type: 'RESTAURANT',
      amount: 14500,
      bank_account: 'HDFC Bank •••• 4920',
      upi_id: 'gourmethub@hdfc',
      status: 'PENDING',
      request_date: '10 Sep 2026',
      period: '01 Sep - 07 Sep'
    },
    {
      id: 'PAY-8902',
      recipient_name: 'Alex Express',
      recipient_type: 'DRIVER',
      amount: 3450,
      bank_account: 'ICICI Bank •••• 1102',
      upi_id: 'alexdriver@icici',
      status: 'COMPLETED',
      request_date: '08 Sep 2026',
      period: '01 Sep - 07 Sep'
    },
    {
      id: 'PAY-8903',
      recipient_name: 'Mario Rossi Bistro',
      recipient_type: 'RESTAURANT',
      amount: 22800,
      bank_account: 'SBI Bank •••• 8831',
      upi_id: 'mariorossi@sbi',
      status: 'PENDING',
      request_date: '11 Sep 2026',
      period: '01 Sep - 07 Sep'
    },
    {
      id: 'PAY-8904',
      recipient_name: 'Rahul Sharma',
      recipient_type: 'DRIVER',
      amount: 2800,
      bank_account: 'Axis Bank •••• 3349',
      upi_id: 'rahulsharma@axis',
      status: 'COMPLETED',
      request_date: '05 Sep 2026',
      period: '25 Aug - 31 Aug'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleDisbursePayout = (payoutId) => {
    Modal.confirm({
      title: 'Confirm Disbursement',
      icon: <WalletOutlined className="text-[#FF521C]" />,
      content: 'Are you sure you want to approve and disburse this payout via Bank/UPI transfer?',
      okText: 'Yes, Disburse Payout',
      cancelText: 'Cancel',
      okButtonProps: { className: 'bg-[#FF521C] hover:bg-[#E04310] border-none font-bold' },
      onOk: () => {
        setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: 'COMPLETED' } : p));
        notification.success({
          title: 'Payout Disbursed',
          description: `Disbursement for ${payoutId} has been completed successfully.`
        });
      }
    });
  };

  const totalPendingAmount = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCompletedAmount = payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayouts = payouts.filter(p => {
    const matchesType = typeFilter === 'ALL' || p.recipient_type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesType && matchesStatus;
  });

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto space-y-4 text-slate-800">
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
            Partner Payouts & Settlement Console
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Approve weekly earnings disbursements for restaurants and delivery partners
          </p>
        </div>

        <button 
          onClick={() => setLoading(false)} 
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ReloadOutlined className={`text-xs ${loading ? 'animate-spin' : ''}`} /> 
          <span>Refresh Payouts</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Disbursements</span>
            <h3 className="text-2xl font-black text-amber-500 mt-0.5">₹{totalPendingAmount.toLocaleString()}</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
              {payouts.filter(p => p.status === 'PENDING').length} requests waiting
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg shadow-2xs">
            <ClockCircleOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disbursed This Month</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">₹{totalCompletedAmount.toLocaleString()}</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Successfully transferred</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shadow-2xs">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Retention Fee</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">15%</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5">Standard commission rate</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-2xs">
            <BankOutlined />
          </div>
        </div>
      </div>

      {/* Filter & Payouts Table */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FilterOutlined className="text-slate-400 text-xs" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Partner Types</option>
              <option value="RESTAURANT">Restaurants Only</option>
              <option value="DRIVER">Delivery Drivers Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Requests</option>
              <option value="COMPLETED">Disbursed Payouts</option>
            </select>
          </div>
        </div>

        {/* Payouts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Payout ID</th>
                <th className="py-2.5 px-3">Partner Name</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3">Bank / UPI Transfer</th>
                <th className="py-2.5 px-3">Payout Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map(p => (
                <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors text-xs">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {p.id}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${p.recipient_type === 'RESTAURANT' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {p.recipient_type === 'RESTAURANT' ? <ShopOutlined /> : <CarOutlined />}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 leading-tight">{p.recipient_name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{p.recipient_type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {p.period}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div className="font-semibold">{p.bank_account}</div>
                    <div className="text-[10px] text-slate-400">{p.upi_id}</div>
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900 text-sm">
                    ₹{p.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    {p.status === 'COMPLETED' ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold">
                        ✓ Disbursed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[10px] font-bold">
                        ⏳ Pending Approval
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {p.status === 'PENDING' ? (
                      <button
                        onClick={() => handleDisbursePayout(p.id)}
                        className="px-3.5 py-1.5 bg-[#FF521C] hover:bg-[#E04310] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        Approve & Disburse →
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400">Paid ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
