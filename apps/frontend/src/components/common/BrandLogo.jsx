import React from 'react';
import { Link } from 'react-router-dom';

export default function BrandLogo({ variant = 'orange', size = 'md', to = '/customer', className = '' }) {
  const sizeMap = {
    sm: { img: 'h-6 max-h-6', text: 'text-xl', offset: '-ml-1' },
    md: { img: 'h-8 max-h-8', text: 'text-2xl', offset: '-ml-1' },
    lg: { img: 'h-10 max-h-10', text: 'text-3xl', offset: '-ml-1.5' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  let textColorStyle = 'bg-gradient-to-r from-[#FF6800] via-[#FF4500] to-[#E61400] bg-clip-text text-transparent';
  if (variant === 'light') {
    textColorStyle = 'text-white';
  } else if (variant === 'dark') {
    textColorStyle = 'text-slate-900';
  }

  return (
    <Link to={to} className={`inline-flex items-center flex-shrink-0 group ${className}`}>
      <img
        src="/orderly-logo.png"
        alt="Orderly"
        className={`${currentSize.img} w-auto object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200`}
      />
      <span className={`font-['Outfit',sans-serif] font-black tracking-[-0.03em] ${currentSize.text} ${textColorStyle} ${currentSize.offset} select-none`}>
        rderly
      </span>
    </Link>
  );
}



