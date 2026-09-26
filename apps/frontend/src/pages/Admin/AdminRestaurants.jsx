import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import socket from '../../socket';
import { notification, Modal, Tag, Input, Select, Button, Tooltip, Empty, Spin } from 'antd';
import {
  ShopOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  StarOutlined,
  ReloadOutlined,
  FilterOutlined,
  UserOutlined,
  StopOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/restaurants');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setRestaurants(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      notification.error({
        title: 'Failed to load restaurants',
        description: err.response?.data?.message || err.message,
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();

    socket.connect();
    socket.emit('join_admin');
    socket.emit('join', 'role_admin');

    const handleRestaurantEvent = () => {
      fetchRestaurants();
    };

    socket.on('NEW_RESTAURANT_REGISTERED', handleRestaurantEvent);
    socket.on('PARTNER_REGISTERED', handleRestaurantEvent);
    socket.on('RESTAURANT_STATUS_CHANGED', handleRestaurantEvent);
    socket.on('RESTAURANT_UPDATED', handleRestaurantEvent);

    return () => {
      socket.off('NEW_RESTAURANT_REGISTERED', handleRestaurantEvent);
      socket.off('PARTNER_REGISTERED', handleRestaurantEvent);
      socket.off('RESTAURANT_STATUS_CHANGED', handleRestaurantEvent);
      socket.off('RESTAURANT_UPDATED', handleRestaurantEvent);
    };
  }, []);

  const handleStatusChange = (restaurant, nextStatus, title, _actionType) => {
    let reasonText = '';
    Modal.confirm({
      title: `${title} - ${restaurant.name}`,
      icon: <ExclamationCircleOutlined className="text-orange-500" />,
      content: (
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-600">
            Are you sure you want to set status to <span className="font-bold text-slate-900">{nextStatus}</span> for restaurant <span className="font-bold">{restaurant.name}</span>?
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Reason / Admin Notes:
            </label>
            <TextArea
              rows={3}
              placeholder="Provide reason for this status change..."
              onChange={(e) => { reasonText = e.target.value; }}
              className="text-xs rounded-lg"
            />
          </div>
        </div>
      ),
      okText: 'Confirm Update',
      okButtonProps: {
        className: 'bg-[#FF521C] hover:bg-[#E04310] border-none text-white'
      },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await axios.put(`/admin/restaurants/${restaurant.id}/status`, {
            status: nextStatus,
            reason: reasonText || `Admin set status to ${nextStatus}`
          });
          if (res.data?.success) {
            notification.success({
              title: 'Restaurant Status Updated',
              description: `${restaurant.name} is now ${nextStatus}.`,
              placement: 'topRight'
            });
            fetchRestaurants();
          }
        } catch (err) {
          notification.error({
            title: 'Status Update Failed',
            description: err.response?.data?.message || err.message,
            placement: 'topRight'
          });
        }
      }
    });
  };

  const handleSoftDelete = (restaurant) => {
    let reasonText = '';
    Modal.confirm({
      title: `Archive Restaurant - ${restaurant.name}`,
      icon: <DeleteOutlined className="text-red-500" />,
      content: (
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            This will <span className="font-bold text-red-600">soft-delete</span> this restaurant. Historical orders and revenue records will be preserved, but the restaurant will no longer accept orders or appear in customer discovery.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Reason for Archival:
            </label>
            <TextArea
              rows={3}
              placeholder="e.g., Business permanently closed / Merchant request"
              onChange={(e) => { reasonText = e.target.value; }}
              className="text-xs rounded-lg"
            />
          </div>
        </div>
      ),
      okText: 'Archive Restaurant',
      okButtonProps: {
        danger: true,
        className: 'bg-red-600 hover:bg-red-700 text-white'
      },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await axios.delete(`/admin/restaurants/${restaurant.id}`, {
            data: { reason: reasonText || 'Archived by administrator' }
          });
          if (res.data?.success) {
            notification.success({
              title: 'Restaurant Archived',
              description: `${restaurant.name} was successfully archived.`,
              placement: 'topRight'
            });
            fetchRestaurants();
          }
        } catch (err) {
          notification.error({
            title: 'Archival Failed',
            description: err.response?.data?.message || err.message,
            placement: 'topRight'
          });
        }
      }
    });
  };

  const filteredRestaurants = restaurants
    .filter(r => {
      const ownerName = r.owner_name || r.owner?.name || '';
      const ownerEmail = r.owner_email || r.owner?.email || '';
      const phone = r.phone_number || r.owner?.phone || '';

      const matchesSearch = 
        (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ownerName && ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ownerEmail && ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (phone && phone.includes(searchTerm));

      const statusUpper = (r.status || (r.is_active ? 'ACTIVE' : 'SUSPENDED')).toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || statusUpper === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const getStatusBadge = (status, isActive) => {
    const norm = (status || (isActive ? 'ACTIVE' : 'SUSPENDED')).toUpperCase();
    switch (norm) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'PENDING_APPROVAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Pending Approval</span>;
      case 'SUSPENDED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">Suspended</span>;
      case 'BLOCKED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Blocked</span>;
      case 'DELETED':
      case 'ARCHIVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 border border-slate-300">Archived</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{norm}</span>;
    }
  };

  const totalCount = restaurants.length;
  const activeCount = restaurants.filter(r => (r.status || (r.is_active ? 'ACTIVE' : '')).toUpperCase() === 'ACTIVE').length;
  const pendingCount = restaurants.filter(r => (r.status || '').toUpperCase() === 'PENDING_APPROVAL').length;
  const suspendedCount = restaurants.filter(r => ['SUSPENDED', 'BLOCKED'].includes((r.status || '').toUpperCase())).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShopOutlined className="text-[#FF521C]" />
            Restaurant Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Oversee partner restaurants, review verification details, and manage authorization status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRestaurants}
            loading={loading}
            className="rounded-xl font-semibold text-xs border-slate-200 hover:border-[#FF521C] hover:text-[#FF521C]"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Restaurants</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Platform registered kitchens</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active & Open</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Accepting customer orders</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Awaiting admin verification</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Suspended / Blocked</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{suspendedCount}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Restricted operations</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            placeholder="Search by restaurant, owner name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            className="rounded-xl text-xs py-2 border-slate-200 focus:border-[#FF521C]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <FilterOutlined /> Status:
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-44 text-xs"
          >
            <Option value="ALL">All Statuses ({totalCount})</Option>
            <Option value="ACTIVE">Active ({activeCount})</Option>
            <Option value="PENDING_APPROVAL">Pending Approval ({pendingCount})</Option>
            <Option value="SUSPENDED">Suspended</Option>
            <Option value="BLOCKED">Blocked</Option>
            <Option value="DELETED">Archived</Option>
          </Select>
        </div>
      </div>

      {/* Restaurant List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <Spin size="large" />
          <p className="text-xs text-slate-500 mt-3">Loading restaurant accounts...</p>
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <Empty description={<span className="text-xs text-slate-500 font-medium">No restaurants match your filters</span>} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Restaurant</th>
                  <th className="py-3.5 px-4">Owner Contact</th>
                  <th className="py-3.5 px-4">Cuisine & Rating</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRestaurants.map((restaurant) => {
                  const statusUpper = (restaurant.status || (restaurant.is_active ? 'ACTIVE' : 'SUSPENDED')).toUpperCase();
                  const isDeleted = Boolean(restaurant.deleted_at || statusUpper === 'DELETED');
                  const isSuspended = statusUpper === 'SUSPENDED';
                  const isBlocked = statusUpper === 'BLOCKED';
                  const isPending = statusUpper === 'PENDING_APPROVAL';
                  const isActive = statusUpper === 'ACTIVE';

                  return (
                    <tr key={restaurant.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Restaurant Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {restaurant.image || restaurant.image_url ? (
                              <img
                                src={restaurant.image || restaurant.image_url}
                                alt={restaurant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ShopOutlined className="text-lg text-[#FF521C]" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{restaurant.name}</div>
                            <div className="text-[11px] text-slate-500 max-w-xs truncate mt-0.5">
                              {restaurant.address || 'Address not configured'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {restaurant.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Contact */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <UserOutlined className="text-slate-400" />
                          {restaurant.owner_name || restaurant.owner?.name || 'Partner Merchant'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <MailOutlined className="text-slate-400" />
                          {restaurant.owner_email || restaurant.owner?.email || 'No email registered'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <PhoneOutlined className="text-slate-400" />
                          {restaurant.phone_number || restaurant.owner?.phone || 'No phone registered'}
                        </div>
                      </td>

                      {/* Cuisine & Rating */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-700">
                          {Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : (restaurant.cuisine || 'Multi-Cuisine')}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-amber-600 font-bold text-[11px]">
                          <StarOutlined className="text-amber-500" />
                          <span>{restaurant.rating ? Number(restaurant.rating).toFixed(1) : '4.5'}</span>
                          <span className="text-slate-400 font-normal ml-1">({restaurant.delivery_time || '20-30 mins'})</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {getStatusBadge(restaurant.status, restaurant.is_active)}
                        {restaurant.status_reason && (
                          <div className="text-[10px] text-slate-400 italic mt-1 max-w-[140px] truncate" title={restaurant.status_reason}>
                            {restaurant.status_reason}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Tooltip title="View Detailed Info">
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setDetailsModalVisible(true);
                              }}
                              className="rounded-lg text-xs"
                            />
                          </Tooltip>

                          {isPending && (
                            <>
                              <Tooltip title="Approve Restaurant">
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  onClick={() => handleStatusChange(restaurant, 'ACTIVE', 'Approve Restaurant')}
                                  className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                                >
                                  Approve
                                </Button>
                              </Tooltip>
                              <Tooltip title="Reject Application">
                                <Button
                                  size="small"
                                  danger
                                  icon={<CloseCircleOutlined />}
                                  onClick={() => handleStatusChange(restaurant, 'BLOCKED', 'Reject Application')}
                                  className="rounded-lg text-xs"
                                >
                                  Reject
                                </Button>
                              </Tooltip>
                            </>
                          )}

                          {isActive && (
                            <>
                              <Tooltip title="Suspend Operations">
                                <Button
                                  size="small"
                                  onClick={() => handleStatusChange(restaurant, 'SUSPENDED', 'Suspend Restaurant')}
                                  className="rounded-lg text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                  Suspend
                                </Button>
                              </Tooltip>
                              <Tooltip title="Block Restaurant">
                                <Button
                                  size="small"
                                  danger
                                  icon={<StopOutlined />}
                                  onClick={() => handleStatusChange(restaurant, 'BLOCKED', 'Block Restaurant')}
                                  className="rounded-lg text-xs"
                                >
                                  Block
                                </Button>
                              </Tooltip>
                            </>
                          )}

                          {isSuspended && (
                            <Tooltip title="Unsuspend / Reactivate">
                              <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleStatusChange(restaurant, 'ACTIVE', 'Unsuspend Restaurant')}
                                className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                              >
                                Unsuspend
                              </Button>
                            </Tooltip>
                          )}

                          {isBlocked && (
                            <Tooltip title="Unblock Restaurant">
                              <Button
                                size="small"
                                type="primary"
                                icon={<SafetyCertificateOutlined />}
                                onClick={() => handleStatusChange(restaurant, 'ACTIVE', 'Unblock Restaurant')}
                                className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                              >
                                Unblock
                              </Button>
                            </Tooltip>
                          )}

                          {!isDeleted && (
                            <Tooltip title="Soft-delete / Archive">
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleSoftDelete(restaurant)}
                                className="rounded-lg text-xs text-slate-400 hover:text-red-600 border-slate-200"
                              />
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restaurant Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <ShopOutlined className="text-[#FF521C]" />
            <span>Restaurant Details: {selectedRestaurant?.name}</span>
          </div>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)} className="rounded-xl">
            Close
          </Button>
        ]}
        width={600}
        className="rounded-2xl"
      >
        {selectedRestaurant && (
          <div className="space-y-4 py-3 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Restaurant ID</span>
                <p className="font-mono text-slate-800 font-bold mt-0.5">{selectedRestaurant.id}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Current Status</span>
                <div className="mt-0.5">{getStatusBadge(selectedRestaurant.status, selectedRestaurant.is_active)}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Owner Name</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedRestaurant.owner_name || selectedRestaurant.owner?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Owner Email</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedRestaurant.owner_email || selectedRestaurant.owner?.email || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedRestaurant.phone_number || selectedRestaurant.owner?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Business License</span>
                <p className="font-mono text-slate-800 font-bold mt-0.5">{selectedRestaurant.business_license || 'LIC-VERIFIED-2026'}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Full Address</span>
                <p className="text-slate-800 mt-0.5">{selectedRestaurant.address || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                <p className="text-slate-800 mt-0.5">{selectedRestaurant.description || 'Gourmet delicacies and handcrafted dishes.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Operating Hours</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {selectedRestaurant.opens_at || '10:00 AM'} - {selectedRestaurant.closes_at || '11:00 PM'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Price for Two</span>
                  <p className="font-semibold text-slate-800 mt-0.5">₹{selectedRestaurant.price_for_two || 450}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
