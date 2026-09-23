import React from 'react';
import { RightOutlined } from '@ant-design/icons';

export default function SectionHeader({ 
  title, 
  subtitle, 
  actionText, 
  onAction, 
  className = '' 
}) {
  return (
    <div className={`flex justify-between items-end mb-8 ${className}`}>
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-neutral-500 text-sm mt-1 font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 font-bold text-sm hover:underline transition-colors group"
        >
          <span>{actionText}</span>
          <RightOutlined className="text-xs group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
}
