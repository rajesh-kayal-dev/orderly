import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { notification } from 'antd';
import axios from '../../api/axios';
import { loginSuccess } from '../../redux/slices/authSlice';
import {
  ShopOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  PictureOutlined,
  CrownOutlined,
  CheckOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const PRESET_BANNERS = [
  {
    name: 'Modern Restaurant & Bistro',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
    tag: 'Popular'
  },
  {
    name: 'Gourmet Burger & Dining',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop',
    tag: 'Fast Food'
  },
  {
    name: 'Asian Fusion & Street Food',
    url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&h=400&fit=crop',
    tag: 'Asian'
  },
  {
    name: 'Bakery, Desserts & Cafe',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=400&fit=crop',
    tag: 'Bakery'
  }
];

export default function RestaurantSettings() {
  const { profile, user, token } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [restaurantName, setRestaurantName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone_number || user?.phone_number || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [imageUrl, setImageUrl] = useState(profile?.image_url || PRESET_BANNERS[0].url);
  const [opensAt, setOpensAt] = useState(profile?.opens_at || '10:00 AM');
  const [closesAt, setClosesAt] = useState(profile?.closes_at || '11:00 PM');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setRestaurantName(profile.name || '');
      setAddress(profile.address || '');
      setDescription(profile.description || '');
      setImageUrl(profile.image_url || PRESET_BANNERS[0].url);
      setOpensAt(profile.opens_at || '10:00 AM');
      setClosesAt(profile.closes_at || '11:00 PM');
    }
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await axios.put('/restaurants/my-profile', {
        name: restaurantName,
        phone_number: phone,
        address: address,
        description: description,
        image_url: imageUrl,
        opens_at: opensAt,
        closes_at: closesAt
      });

      if (res.data?.success) {
        dispatch(loginSuccess({
          user,
          profile: res.data.data,
          token
        }));
        notification.success({
          title: 'Restaurant Customized!',
          description: 'Your restaurant name, cover banner, and details have been updated.',
          placement: 'topRight'
        });
      }
    } catch (err) {
      notification.error({
        title: 'Save Failed',
        description: err.response?.data?.message || 'Failed to save restaurant settings.',
        placement: 'topRight'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto animate-fade-in text-slate-800">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Restaurant Customization Studio</h2>
        <p className="text-xs text-slate-500 font-medium">
          Customize your restaurant branding, banner header, address, and customer-facing info
        </p>
      </div>

      {/* Live Preview Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Live Customer Preview</span>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full">
            ● Active Profile
          </span>
        </div>

        <div className="relative h-44 overflow-hidden bg-slate-900">
          <img
            src={imageUrl || PRESET_BANNERS[0].url}
            alt="Preview Banner"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-5">
            <div>
              <span className="bg-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {description || 'Gourmet Dining'}
              </span>
              <h3 className="text-2xl font-black text-white mt-1 leading-tight">
                {restaurantName || "Rajesh Kayal's Restaurant"}
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5 flex items-center gap-2">
                <span>📍 {address || 'Local Restaurant Address'}</span>
                <span>•</span>
                <span>🕒 {opensAt} - {closesAt}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-6">
        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
          1. Branding & Identity
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Restaurant Name
            </label>
            <div className="relative">
              <ShopOutlined className="absolute left-3.5 top-3 text-slate-400 text-sm" />
              <input
                type="text"
                value={restaurantName}
                onChange={e => setRestaurantName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="e.g. Rajesh's Gourmet Kitchen"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Cuisine / Tagline
            </label>
            <div className="relative">
              <AppstoreOutlined className="absolute left-3.5 top-3 text-slate-400 text-sm" />
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="e.g. Gourmet Burgers, Fast Food & Sides"
              />
            </div>
          </div>
        </div>

        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 pt-2 uppercase tracking-wider">
          2. Store Cover Theme & Banner Image
        </h3>

        {/* Preset Cover Themes */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Choose a Cover Theme Preset
          </label>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRESET_BANNERS.map((theme) => {
              const isSelected = imageUrl === theme.url;
              return (
                <div
                  key={theme.name}
                  onClick={() => setImageUrl(theme.url)}
                  className={`relative h-24 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group ${
                    isSelected
                      ? 'border-[#FF521C] shadow-md ring-2 ring-orange-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={theme.url} alt={theme.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 p-2 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-white bg-orange-600 px-1.5 py-0.5 rounded-md w-fit">
                      {theme.tag}
                    </span>
                    <span className="text-[10px] font-bold text-white leading-tight">
                      {theme.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FF521C] text-white flex items-center justify-center text-xs shadow-xs">
                      <CheckOutlined />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Custom Cover Banner URL
          </label>
          <div className="relative">
            <PictureOutlined className="absolute left-3.5 top-3 text-slate-400 text-sm" />
            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Paste image URL here"
            />
          </div>
        </div>

        <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 pt-2 uppercase tracking-wider">
          3. Address & Operating Hours
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Store Address
          </label>
          <div className="relative">
            <EnvironmentOutlined className="absolute left-3.5 top-3 text-slate-400 text-sm" />
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Full store street address and location"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Opens At
            </label>
            <div className="relative">
              <ClockCircleOutlined className="absolute left-3.5 top-3 text-slate-400 text-sm" />
              <input
                type="text"
                value={opensAt}
                onChange={e => setOpensAt(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="e.g. 10:00 AM"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Closes At
            </label>
            <div className="relative">
              <ClockCircleOutlined className="absolute left-3.5 top-3 text-slate-400 text-sm" />
              <input
                type="text"
                value={closesAt}
                onChange={e => setClosesAt(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="e.g. 11:00 PM"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <PhoneOutlined className="absolute left-3.5 top-3 text-slate-400 text-sm" />
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="Contact Phone"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#FF521C] hover:bg-[#E04310] text-white px-8 py-3 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving Customizations...' : 'Save Restaurant Customization'}
          </button>
        </div>
      </form>
    </div>
  );
}
