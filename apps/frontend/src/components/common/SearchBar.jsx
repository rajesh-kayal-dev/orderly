import React from 'react';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

export default function SearchBar({ 
  value = '', 
  onChange, 
  onClear, 
  placeholder = 'Search dishes, cuisines, or restaurants...',
  className = ''
}) {
  return (
    <div className={`relative flex items-center w-full group ${className}`}>
      <SearchOutlined className="absolute left-4 text-neutral-400 group-focus-within:text-orange-500 text-lg transition-colors z-10" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3.5 bg-white border border-neutral-200 rounded-2xl text-sm font-medium text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-4 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
          aria-label="Clear search"
        >
          <ClearOutlined className="text-sm" />
        </button>
      )}
    </div>
  );
}
