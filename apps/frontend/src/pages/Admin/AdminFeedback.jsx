import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import socket from '../../socket';
import { notification, Tag, Input, Select, Button, Spin, Empty } from 'antd';
import {
  StarOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  UserOutlined,
  ShoppingOutlined
} from '@ant-design/icons';

const { Option } = Select;

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, happy: 0, satisfied: 0, unsatisfied: 0, bad: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/feedback', {
        params: {
          sentiment: sentimentFilter !== 'ALL' ? sentimentFilter : undefined,
          search: searchTerm || undefined
        }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setFeedbacks(res.data.data);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching admin feedback:', err);
      notification.error({
        message: 'Failed to load feedback',
        description: err.response?.data?.message || err.message,
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [sentimentFilter]);

  // Realtime Socket listener for new feedback
  useEffect(() => {
    const handleNewFeedback = (fb) => {
      setFeedbacks((prev) => {
        const existingIdx = prev.findIndex((item) => item.id === fb.id || item.order_id === fb.order_id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...fb };
          return updated;
        }
        return [fb, ...prev];
      });

      notification.info({
        message: `New Feedback: ${fb.sentiment}`,
        description: `${fb.customer_name || 'A customer'} rated order #${(fb.order_id || '').slice(0, 8).toUpperCase()}`,
        placement: 'topRight'
      });
    };

    socket.on('NEW_FEEDBACK', handleNewFeedback);
    return () => {
      socket.off('NEW_FEEDBACK', handleNewFeedback);
    };
  }, []);

  const getSentimentTag = (sentiment) => {
    switch (sentiment) {
      case 'Happy':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <SmileOutlined className="text-emerald-600" />
            Happy
          </span>
        );
      case 'Satisfied':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <SmileOutlined className="text-blue-600" />
            Satisfied
          </span>
        );
      case 'Unsatisfied':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <MehOutlined className="text-amber-600" />
            Unsatisfied
          </span>
        );
      case 'Bad':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <FrownOutlined className="text-rose-600" />
            Bad
          </span>
        );
      default:
        return <Tag>{sentiment}</Tag>;
    }
  };

  const happyPercentage = summary.total > 0
    ? Math.round(((summary.happy + summary.satisfied) / summary.total) * 100)
    : 100;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <StarOutlined className="text-[#FF521C]" />
            Customer Feedback & Reviews
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Realtime customer sentiments across delivered orders on Orderly platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchFeedback}
            loading={loading}
            className="rounded-xl font-semibold text-xs border-slate-200 hover:border-[#FF521C] hover:text-[#FF521C]"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Feedbacks</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{summary.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Delivered orders reviewed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Happy</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{summary.happy}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Exceptional dining experience</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Satisfied</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{summary.satisfied}</div>
          <div className="text-[10px] text-blue-500/80 mt-0.5">Good food & on-time delivery</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Unsatisfied</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{summary.unsatisfied}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Minor issues reported</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Bad</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{summary.bad}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Requires kitchen escalation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            placeholder="Search by order ID, customer name, comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={fetchFeedback}
            allowClear
            className="rounded-xl text-xs py-2 border-slate-200 focus:border-[#FF521C]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <FilterOutlined /> Sentiment:
          </div>
          <Select
            value={sentimentFilter}
            onChange={setSentimentFilter}
            className="w-44 text-xs"
          >
            <Option value="ALL">All Sentiments</Option>
            <Option value="Happy">Happy 🟢</Option>
            <Option value="Satisfied">Satisfied 🔵</Option>
            <Option value="Unsatisfied">Unsatisfied 🟠</Option>
            <Option value="Bad">Bad 🔴</Option>
          </Select>
        </div>
      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <Spin size="large" />
          <p className="text-xs text-slate-500 mt-3">Loading feedback...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <Empty description={<span className="text-xs text-slate-500 font-medium">No feedback recorded yet</span>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Sentiment + Date */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getSentimentTag(item.sentiment)}
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                  </span>
                </div>

                {/* Comment Text */}
                {item.comment ? (
                  <p className="text-xs text-slate-800 font-medium italic bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                    "{item.comment}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic mb-3">No written comment provided.</p>
                )}

                {/* Ordered Items Summary */}
                {item.items_summary && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mb-2">
                    <ShoppingOutlined className="text-slate-400 shrink-0" />
                    <span className="truncate">{item.items_summary}</span>
                  </div>
                )}
              </div>

              {/* Bottom Metadata: Restaurant + Customer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 truncate">
                  <ShopOutlined className="text-orange-500" />
                  <span className="truncate">{item.restaurant_name || 'Restaurant Kitchen'}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium shrink-0">
                  <UserOutlined className="text-slate-400" />
                  <span>{item.customer_name || 'Customer'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-mono text-slate-400">#{item.order_number || item.order_id?.slice(0, 6).toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
