import React from 'react';
import { StarOutlined, LikeOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';

export default function RestaurantReviews() {
  const reviews = [
    {
      id: 1,
      customer: 'Ananya Sharma',
      rating: 5,
      date: 'Yesterday',
      comment: 'The burger was incredibly fresh and delivered super hot! Outstanding quality and packaging.',
      dish: 'Classic Cheese Burger Meal'
    },
    {
      id: 2,
      customer: 'Rahul Verma',
      rating: 5,
      date: '3 days ago',
      comment: 'Best food delivery in town. Quick prep and generous portions!',
      dish: 'Crispy Chicken Wings & Fries'
    },
    {
      id: 3,
      customer: 'Priya Nair',
      rating: 4,
      date: '1 week ago',
      comment: 'Tasted great. Could use a little less salt, but overall very satisfying meal.',
      dish: 'Gourmet Veg Supreme Pizza'
    }
  ];

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews</h2>
          <p className="text-xs text-slate-500 font-medium">Track customer satisfaction and feedback</p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-xs">
          <StarOutlined className="text-amber-500 text-lg" />
          <span className="text-sm font-black text-slate-900">4.8 / 5.0</span>
          <span className="text-xs text-slate-400 font-semibold">(24 reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Reviews</p>
          <p className="text-3xl font-black text-slate-900">24</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">5-Star Ratings</p>
          <p className="text-3xl font-black text-emerald-600">88%</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Response Rate</p>
          <p className="text-3xl font-black text-orange-600">100%</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6">
        <h3 className="text-base font-black text-slate-900 mb-6">Recent Customer Feedback</h3>
        <div className="space-y-6">
          {reviews.map(item => (
            <div key={item.id} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                    {item.customer.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.customer}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Ordered: {item.dish}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(item.rating)].map((_, i) => (
                      <StarOutlined key={i} className="text-sm" />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                "{item.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
