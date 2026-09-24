import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import socket from '../../socket';
import { useSelector } from 'react-redux';
import { notification, Button, Spin, Empty, Tag } from 'antd';
import {
  StarOutlined,
  ReloadOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  UserOutlined,
  ShoppingOutlined,
  LikeOutlined
} from '@ant-design/icons';

export default function RestaurantReviews() {
  const { user, profile } = useSelector((state) => state.auth);
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState({ total: 0, happyRate: 100, counts: { Happy: 0, Satisfied: 0, Unsatisfied: 0, Bad: 0 } });
  const [loading, setLoading] = useState(false);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/restaurant/feedback');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setFeedbacks(res.data.data);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching restaurant reviews:', err);
      notification.error({
        message: 'Failed to load customer feedback',
        description: err.response?.data?.message || err.message,
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  // Realtime Socket listener for live feedback submissions from customers
  useEffect(() => {
    const handleNewFeedback = (fb) => {
      // If feedback belongs to this restaurant
      const myRestId = profile?.id || `rest-${user?.id}`;
      if (fb.restaurant_id === myRestId || fb.restaurant_id === user?.id || fb.restaurant_id === '1') {
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
          message: `New Feedback: "${fb.sentiment}"`,
          description: `${fb.customer_name || 'Customer'} submitted feedback for order #${(fb.order_id || '').slice(0, 8).toUpperCase()}`,
          placement: 'topRight'
        });

        // Re-fetch summary stats
        fetchFeedback();
      }
    };

    socket.on('NEW_FEEDBACK', handleNewFeedback);
    return () => {
      socket.off('NEW_FEEDBACK', handleNewFeedback);
    };
  }, [profile?.id, user?.id]);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <StarOutlined className="text-[#FF521C]" />
            Customer Feedback & Reviews
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Realtime dining feedback on delivered orders. Live updates without page reload.
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reviews</p>
          <p className="text-3xl font-black text-slate-900">{summary.total}</p>
          <p className="text-[10px] text-slate-400 mt-1">From delivered customer orders</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Happy Sentiments</p>
          <p className="text-3xl font-black text-emerald-600">{summary.counts?.Happy || 0}</p>
          <p className="text-[10px] text-emerald-500/80 mt-1">Exceptional dining experience</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-1">Satisfied</p>
          <p className="text-3xl font-black text-blue-600">{summary.counts?.Satisfied || 0}</p>
          <p className="text-[10px] text-blue-500/80 mt-1">Met customer expectations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1">Needs Attention</p>
          <p className="text-3xl font-black text-rose-600">{(summary.counts?.Unsatisfied || 0) + (summary.counts?.Bad || 0)}</p>
          <p className="text-[10px] text-rose-500/80 mt-1">Unsatisfied / Bad feedback</p>
        </div>
      </div>

      {/* Feedback Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Delivered Order Reviews ({feedbacks.length})
          </h3>
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            Live Realtime Connected
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Spin size="large" />
            <p className="text-xs text-slate-500 mt-3">Loading feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <Empty description={<span className="text-xs text-slate-500 font-medium">No reviews received for your kitchen yet</span>} />
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors space-y-3"
              >
                {/* Header: Customer + Sentiment */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-[#FF521C] flex items-center justify-center font-bold text-xs shrink-0">
                      {item.customer_name ? item.customer_name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.customer_name || 'Customer'}</h4>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Order #{item.order_number || item.order_id?.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getSentimentTag(item.sentiment)}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                </div>

                {/* Ordered Meal Summary */}
                {item.items_summary && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-100">
                    <ShoppingOutlined className="text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-500">Ordered:</span>
                    <span className="font-semibold text-slate-800 truncate">{item.items_summary}</span>
                  </div>
                )}

                {/* Customer Comment */}
                {item.comment ? (
                  <p className="text-xs text-slate-700 font-medium italic pl-1">
                    "{item.comment}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic pl-1">
                    No written comment left.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
