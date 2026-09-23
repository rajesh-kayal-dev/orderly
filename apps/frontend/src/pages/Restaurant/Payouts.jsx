import React from 'react';
import { WalletOutlined, ArrowUpOutlined, BankOutlined, CheckCircleOutlined } from '@ant-design/icons';

export default function RestaurantPayouts() {
  const transactions = [
    { id: 'PAY-88219', date: '10 Sep 2026', amount: '₹12,450', status: 'Completed', bank: 'HDFC Bank ****4910' },
    { id: 'PAY-88102', date: '03 Sep 2026', amount: '₹18,900', status: 'Completed', bank: 'HDFC Bank ****4910' },
    { id: 'PAY-87941', date: '27 Aug 2026', amount: '₹15,200', status: 'Completed', bank: 'HDFC Bank ****4910' }
  ];

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payouts & Earnings</h2>
          <p className="text-xs text-slate-500 font-medium">Manage payouts, bank transfers, and billing history</p>
        </div>

        <button className="bg-[#FF521C] hover:bg-[#E04310] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20">
          Request Payout Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0F172A] text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Balance</p>
          <p className="text-3xl font-black text-white mb-4">₹24,850</p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
            <CheckCircleOutlined /> Ready for instant transfer
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pending Clearance</p>
          <p className="text-3xl font-black text-slate-900 mb-4">₹4,120</p>
          <p className="text-xs text-slate-400 font-medium">Clears in 24-48 hours</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Paid Out</p>
          <p className="text-3xl font-black text-emerald-600 mb-4">₹1,46,550</p>
          <p className="text-xs text-slate-400 font-medium">100% successful payouts</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
        <h3 className="text-base font-black text-slate-900 mb-6">Recent Bank Transfers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Payout Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(item => (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors text-sm">
                  <td className="py-4 px-4 font-mono font-bold text-slate-800">{item.id}</td>
                  <td className="py-4 px-4 text-slate-600">{item.date}</td>
                  <td className="py-4 px-4 text-slate-600 flex items-center gap-2">
                    <BankOutlined className="text-slate-400" />
                    <span>{item.bank}</span>
                  </td>
                  <td className="py-4 px-4 font-black text-slate-900">{item.amount}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold">
                      {item.status}
                    </span>
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
