import React from 'react';
import { InboxOutlined } from '@ant-design/icons';

export default function EmptyState({
  title = 'No items found',
  description = 'Try adjusting your search filters or browse other options.',
  icon,
  actionText,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-neutral-100 shadow-sm ${className}`}>
      <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-3xl mb-4 shadow-sm">
        {icon || <InboxOutlined />}
      </div>
      <h3 className="text-xl font-bold text-neutral-800 mb-1">{title}</h3>
      <p className="text-neutral-500 text-sm max-w-sm leading-relaxed mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
