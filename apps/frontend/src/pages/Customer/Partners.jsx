import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';
import socket from '../../socket';
import { 
  SearchOutlined, 
  StarFilled, 
  EnvironmentOutlined, 
  CarOutlined, 
  ArrowRightOutlined,
  CheckOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  CloseOutlined,
  SendOutlined,
  MessageOutlined,
  CheckCircleFilled,
  LockOutlined
} from '@ant-design/icons';

export default function Partners() {
  const { user } = useSelector(state => state.auth);
  const [partnersList, setPartnersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const [selectedAvailability, setSelectedAvailability] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Live Messaging Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [messageSentStatus, setMessageSentStatus] = useState(false);

  // Fetch ONLY real approved delivery partners from backend database
  useEffect(() => {
    const fetchApprovedPartners = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/auth/approved-partners');
        if (response.data?.success && Array.isArray(response.data.data)) {
          setPartnersList(response.data.data);
        } else {
          setPartnersList([]);
        }
      } catch (err) {
        console.error('Failed to fetch real delivery partners:', err);
        setPartnersList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedPartners();

    // Listen for real-time driver status updates
    socket.on('DRIVER_STATUS_UPDATED', (data) => {
      setPartnersList(prev => prev.map(p => {
        const matchesUser = String(p.id) === String(data.userId);
        const matchesDriverId = String(p.id) === String(data.driverId) || (p.driverId && String(p.driverId) === String(data.driverId));

        if (matchesUser || matchesDriverId) {
          const isOnlineNow = Boolean(
            data.is_online !== undefined ? data.is_online : 
            (data.is_available !== undefined ? data.is_available : data.status === 'Online' || data.status === 'available')
          );
          return {
            ...p,
            status: isOnlineNow ? 'Online' : 'Offline',
            is_online: isOnlineNow,
            is_available: isOnlineNow
          };
        }
        return p;
      }));
    });

    return () => {
      socket.off('DRIVER_STATUS_UPDATED');
    };
  }, []);

  const checkIsOnline = (partner) => {
    if (partner.is_available !== undefined && partner.is_available !== null) {
      return Boolean(partner.is_available);
    }
    if (partner.is_online !== undefined && partner.is_online !== null) {
      return Boolean(partner.is_online);
    }
    return partner.status === 'Online' || partner.status === 'available';
  };

  // Filtering Logic
  const filteredPartners = useMemo(() => {
    return partnersList.filter(partner => {
      const isOnline = checkIsOnline(partner);

      const matchesSearch = (partner.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (partner.area || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesArea = selectedArea === 'All Areas' || (partner.area || '').toLowerCase() === selectedArea.toLowerCase();

      let matchesAvailability = true;
      if (selectedAvailability === 'Online Now') {
        matchesAvailability = isOnline;
      } else if (selectedAvailability === 'High Rated') {
        matchesAvailability = (partner.rating || 0) >= 4.8;
      } else if (selectedAvailability === 'Top Partners') {
        const delCount = parseInt((partner.deliveries || '0').toString().replace(/,/g, '')) || 0;
        matchesAvailability = delCount >= 500;
      }

      return matchesSearch && matchesArea && matchesAvailability;
    }).sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'deliveries') return parseInt((b.deliveries || '0').toString().replace(/,/g, '')) - parseInt((a.deliveries || '0').toString().replace(/,/g, ''));
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [partnersList, searchTerm, selectedArea, selectedAvailability, sortBy]);

  // Handle live message submit to delivery partner
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedPartner) return;

    const newMsg = {
      id: Date.now(),
      sender: user?.full_name || 'Customer',
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, newMsg]);
    
    if (socket && socket.connected) {
      socket.emit('CUSTOMER_MESSAGE', {
        partnerId: selectedPartner.id,
        senderName: user?.full_name || 'Customer',
        message: chatMessage.trim()
      });
    }

    setChatMessage('');
    setMessageSentStatus(true);

    setTimeout(() => {
      setMessageSentStatus(false);
    }, 3000);
  };

  const areasList = ['All Areas', 'Kolkata', 'Salt Lake', 'New Town', 'Rajarhat', 'Howrah', 'Other'];
  const availabilityOptions = ['All', 'Online Now', 'High Rated', 'Top Partners'];

  return (
    <div className="pb-16 animate-fade-in -mt-16 bg-[#F8FAFC]">
      
      {/* ── 1. HERO BANNER ── */}
      <div className="bg-neutral-900 text-white pt-24 pb-16 border-b border-neutral-800 relative overflow-hidden">
        <img 
          src="/brand_foods/delevery_partner_band.png" 
          alt="Delivery Partner Banner" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-900/60 to-neutral-950/30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2 border border-orange-500/30">
              🛵 Registered Delivery Partners
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Meet Our <span className="text-orange-500">Partners</span>
            </h1>
            <p className="text-neutral-300 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
              Real registered drivers. Active status monitoring. Delivering fast and safe.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold">
                <span className="text-base">🛵</span>
                <div>
                  <p className="leading-none text-white">Verified Accounts</p>
                  <p className="text-[10px] text-neutral-300 font-normal mt-0.5">Real system partners</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold">
                <span className="text-base">🟢</span>
                <div>
                  <p className="leading-none text-white">Live Online Status</p>
                  <p className="text-[10px] text-neutral-300 font-normal mt-0.5">Real-time availability</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MAIN CONTENT AREA ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        
        {/* Top Info Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <p className="text-xs font-bold text-slate-600">
            Showing <span className="text-orange-600 font-black">{filteredPartners.length}</span> real delivery partners
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
            >
              <option value="rating">Rating (Highest First)</option>
              <option value="deliveries">Total Deliveries</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ── LEFT SIDEBAR FILTERS ── */}
          <aside className="w-full lg:w-60 shrink-0 space-y-6 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            
            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Search Partner
              </label>
              <div className="relative">
                <SearchOutlined className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search delivery partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Availability Filter */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
                Availability
              </h3>
              <div className="space-y-2">
                {availabilityOptions.map((opt) => {
                  const isChecked = selectedAvailability === opt;
                  return (
                    <label
                      key={opt}
                      onClick={() => setSelectedAvailability(opt)}
                      className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors select-none"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-orange-600 border-orange-600 text-white shadow-xs' 
                          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                      }`}>
                        {isChecked && <CheckOutlined className="text-[10px]" />}
                      </div>
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Areas Filter */}
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
                Areas
              </h3>
              <div className="space-y-2">
                {areasList.map((area) => {
                  const isChecked = selectedArea === area;
                  return (
                    <label
                      key={area}
                      onClick={() => setSelectedArea(area)}
                      className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors select-none"
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked 
                          ? 'bg-orange-600 border-orange-600 text-white shadow-xs' 
                          : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                      }`}>
                        {isChecked && <CheckOutlined className="text-[10px]" />}
                      </div>
                      <span>{area}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* ── RIGHT PARTNER CARDS GRID ── */}
          <main className="flex-1 w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold text-xs">Loading real delivery partners...</p>
              </div>
            ) : filteredPartners.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {filteredPartners.map((partner) => {
                  const isOnline = checkIsOnline(partner);

                  return (
                    <div
                      key={partner.id}
                      className={`bg-white rounded-3xl p-4 md:p-5 border shadow-xs transition-all duration-300 flex flex-col justify-between group relative overflow-hidden text-center ${
                        isOnline ? 'border-slate-200 hover:shadow-xl hover:border-orange-200' : 'border-slate-200/60 bg-slate-50/50 opacity-80'
                      }`}
                    >
                      {/* Top Ambient Circle Graphic */}
                      <div className="w-28 h-28 rounded-full bg-gradient-to-b from-orange-50 to-transparent absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none" />

                      {/* Driver Circular Photo */}
                      <div className="relative mx-auto mb-3">
                        <img
                          src={partner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                          alt={partner.name}
                          className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover relative z-10 group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Status Badge */}
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border">
                          {isOnline ? (
                            <span className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 border">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Online
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 border">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Offline
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Partner Name & Rating */}
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center justify-center gap-1 text-xs font-extrabold text-slate-800">
                          <StarFilled className="text-amber-400 text-xs" />
                          <span>{partner.rating || 4.9}</span>
                          <span className="text-slate-400 font-medium">({partner.reviewsCount || 100})</span>
                        </div>

                        <h3 className="font-black text-slate-900 text-base group-hover:text-orange-600 transition-colors">
                          {partner.name || 'Delivery Partner'}
                        </h3>

                        <p className="text-[11px] text-slate-500 font-semibold flex items-center justify-center gap-1 truncate">
                          <EnvironmentOutlined className="text-orange-500 text-xs shrink-0" />
                          <span>{partner.area || 'Salt Lake'}, {partner.city || 'Kolkata'}</span>
                        </p>

                        <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1 pt-0.5">
                          <CarOutlined className="text-slate-400 text-xs" />
                          <span>{partner.deliveries || '0'} Deliveries</span>
                        </p>
                      </div>

                      {/* Action Button: Disabled if partner is Offline */}
                      <button
                        disabled={!isOnline}
                        onClick={() => {
                          if (isOnline) {
                            setSelectedPartner(partner);
                            setChatHistory([]);
                          }
                        }}
                        className={`w-full py-2.5 font-extrabold text-xs rounded-2xl border transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                          isOnline
                            ? 'bg-[#FFF4F0] hover:bg-[#FFE8E0] active:scale-98 text-orange-600 border-orange-100 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {isOnline ? (
                          <>
                            <span>View Profile</span>
                            <ArrowRightOutlined className="text-xs" />
                          </>
                        ) : (
                          <>
                            <LockOutlined className="text-xs" />
                            <span>Offline</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State when no real delivery partners registered */
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 text-xl flex items-center justify-center mx-auto">
                  <SearchOutlined />
                </div>
                <h3 className="font-black text-slate-800 text-base">No real delivery partners found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  There are currently no registered delivery partner accounts matching your filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedArea('All Areas');
                    setSelectedAvailability('All');
                  }}
                  className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs hover:bg-orange-700 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </main>

        </div>

      </div>

      {/* ── 3. DRIVER PROFILE DETAIL & REAL-TIME MESSAGING MODAL ── */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl relative space-y-5 my-8">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedPartner(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer z-10"
            >
              <CloseOutlined className="text-xs" />
            </button>

            {/* Driver Profile Header */}
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <img
                src={selectedPartner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                alt={selectedPartner.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-orange-500 shadow-md shrink-0"
              />
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider mb-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedPartner.status || 'Online'}
                </div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedPartner.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedPartner.area || 'Salt Lake'}, {selectedPartner.city || 'Kolkata'}
                </p>
              </div>
            </div>

            {/* Profile Statistics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rating Score</span>
                <p className="text-base font-black text-slate-900 flex items-center gap-1">
                  <StarFilled className="text-amber-400 text-sm" />
                  {selectedPartner.rating || 4.9} <span className="text-xs text-slate-400 font-normal">({selectedPartner.reviewsCount || 100})</span>
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed Orders</span>
                <p className="text-base font-black text-slate-900">
                  {selectedPartner.deliveries || '0'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5 col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered Vehicle</span>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CarOutlined className="text-orange-500" />
                  {selectedPartner.vehicle || 'Scooter (WB-02-AK-9821)'}
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-100/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <SafetyCertificateOutlined className="text-emerald-500 text-base" />
                <span>Background Verified Partner</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Since {selectedPartner.joinDate || '2024'}</span>
            </div>

            {/* LIVE MESSAGING & CHAT SECTION */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MessageOutlined className="text-orange-500 text-sm" />
                  <span>Send Direct Message</span>
                </h4>
                {messageSentStatus && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircleFilled className="text-xs" /> Message sent to partner!
                  </span>
                )}
              </div>

              {/* Chat Messages History */}
              {chatHistory.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                  {chatHistory.map(msg => (
                    <div key={msg.id} className="bg-orange-500 text-white p-2.5 rounded-2xl max-w-[85%] ml-auto text-left shadow-xs">
                      <p className="text-xs font-medium leading-relaxed">{msg.text}</p>
                      <span className="text-[9px] text-orange-100 block text-right font-bold mt-1">{msg.time} • Delivered</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Send message to ${selectedPartner.name.split(' ')[0]}...`}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <SendOutlined className="text-xs" />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Direct Phone Call Button */}
            {selectedPartner.phone && (
              <a
                href={`tel:${selectedPartner.phone}`}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PhoneOutlined />
                <span>Call Partner ({selectedPartner.phone})</span>
              </a>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
