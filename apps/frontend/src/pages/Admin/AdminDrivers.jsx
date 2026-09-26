import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import socket from '../../socket';
import { notification, Modal, Tag, Input, Select, Button, Tooltip, Empty, Spin } from 'antd';
import {
  CarOutlined,
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
  EyeOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/delivery-partners');
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDrivers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      notification.error({
        title: 'Failed to load delivery partners',
        description: err.response?.data?.message || err.message,
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();

    socket.connect();
    socket.emit('join_admin');
    socket.emit('join', 'role_admin');

    const handleDriverEvent = () => {
      fetchDrivers();
    };

    socket.on('NEW_DELIVERY_PARTNER_REGISTERED', handleDriverEvent);
    socket.on('PARTNER_REGISTERED', handleDriverEvent);
    socket.on('DELIVERY_PARTNER_UPDATED', handleDriverEvent);
    socket.on('DRIVER_STATUS_UPDATED', handleDriverEvent);
    socket.on('PARTNER_APPROVED', handleDriverEvent);

    return () => {
      socket.off('NEW_DELIVERY_PARTNER_REGISTERED', handleDriverEvent);
      socket.off('PARTNER_REGISTERED', handleDriverEvent);
      socket.off('DELIVERY_PARTNER_UPDATED', handleDriverEvent);
      socket.off('DRIVER_STATUS_UPDATED', handleDriverEvent);
      socket.off('PARTNER_APPROVED', handleDriverEvent);
    };
  }, []);

  const handleStatusChange = (driver, nextStatus, title) => {
    let reasonText = '';
    Modal.confirm({
      title: `${title} - ${driver.name}`,
      icon: <ExclamationCircleOutlined className="text-orange-500" />,
      content: (
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-600">
            Set partner status to <span className="font-bold text-slate-900">{nextStatus}</span> for <span className="font-bold">{driver.name}</span>?
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
          const res = await axios.put(`/admin/delivery-partners/${driver.id}/status`, {
            status: nextStatus,
            reason: reasonText || `Admin set status to ${nextStatus}`
          });
          if (res.data?.success) {
            notification.success({
              title: 'Partner Status Updated',
              description: `${driver.name} is now ${nextStatus}.`,
              placement: 'topRight'
            });
            fetchDrivers();
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

  const handleSoftDelete = (driver) => {
    let reasonText = '';
    Modal.confirm({
      title: `Archive Driver - ${driver.name}`,
      icon: <DeleteOutlined className="text-red-500" />,
      content: (
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-600">
            This will <span className="font-bold text-red-600">soft-delete</span> this delivery partner. Past delivery records will be preserved for auditing.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Reason for Archival:
            </label>
            <TextArea
              rows={3}
              placeholder="e.g. Partner account decommissioned"
              onChange={(e) => { reasonText = e.target.value; }}
              className="text-xs rounded-lg"
            />
          </div>
        </div>
      ),
      okText: 'Archive Driver',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await axios.delete(`/admin/delivery-partners/${driver.id}`, {
            data: { reason: reasonText || 'Archived by administrator' }
          });
          if (res.data?.success) {
            notification.success({
              title: 'Partner Archived',
              description: `${driver.name} was successfully archived.`,
              placement: 'topRight'
            });
            fetchDrivers();
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

  const filteredDrivers = drivers
    .filter(d => {
      const matchesSearch = 
        (d.name && d.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.phone && d.phone.includes(searchTerm)) ||
        (d.vehicle_number && d.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()));

      const statusUpper = (d.status || (d.is_active ? 'ACTIVE' : 'SUSPENDED')).toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || statusUpper === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime());

  const getStatusBadge = (status, isActive) => {
    const norm = (status || (isActive ? 'ACTIVE' : 'SUSPENDED')).toUpperCase();
    switch (norm) {
      case 'ACTIVE':
      case 'VERIFIED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Active</span>;
      case 'PENDING_APPROVAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Pending Review</span>;
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

  const totalCount = drivers.length;
  const activeCount = drivers.filter(d => ['ACTIVE', 'VERIFIED'].includes((d.status || (d.is_active ? 'ACTIVE' : '')).toUpperCase())).length;
  const pendingCount = drivers.filter(d => (d.status || '').toUpperCase() === 'PENDING_APPROVAL').length;
  const suspendedCount = drivers.filter(d => ['SUSPENDED', 'BLOCKED'].includes((d.status || '').toUpperCase())).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CarOutlined className="text-[#FF521C]" />
            Delivery Partner Fleet
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Manage dispatch fleet, approve partner drivers, and monitor delivery authorization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDrivers}
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
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Fleet</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Registered partners</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Drivers</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Eligible for order assignment</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Approval</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Vehicle documents submitted</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Suspended / Blocked</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{suspendedCount}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Dispatch prohibited</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            placeholder="Search by driver name, email, phone, vehicle plate..."
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
            <Option value="PENDING_APPROVAL">Pending Review ({pendingCount})</Option>
            <Option value="SUSPENDED">Suspended</Option>
            <Option value="BLOCKED">Blocked</Option>
            <Option value="DELETED">Archived</Option>
          </Select>
        </div>
      </div>

      {/* Driver List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <Spin size="large" />
          <p className="text-xs text-slate-500 mt-3">Loading delivery fleet...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <Empty description={<span className="text-xs text-slate-500 font-medium">No delivery partners match your filters</span>} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Partner Name</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Vehicle & Details</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDrivers.map((driver) => {
                  const statusUpper = (driver.status || (driver.is_active ? 'ACTIVE' : 'SUSPENDED')).toUpperCase();
                  const isDeleted = Boolean(driver.deleted_at || statusUpper === 'DELETED');
                  const isSuspended = statusUpper === 'SUSPENDED';
                  const isBlocked = statusUpper === 'BLOCKED';
                  const isPending = statusUpper === 'PENDING_APPROVAL';
                  const isActive = ['ACTIVE', 'VERIFIED'].includes(statusUpper);

                  return (
                    <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                            <CarOutlined className="text-teal-600 text-base" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{driver.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {driver.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                          <MailOutlined className="text-slate-400" />
                          {driver.email}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <PhoneOutlined className="text-slate-400" />
                          {driver.phone || '+91 98765 00000'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">
                          {driver.vehicle_name || driver.vehicle_type || 'Motorcycle'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {driver.vehicle_number || driver.vehicle_license || 'MH 12 AB 1234'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(driver.status, driver.is_active)}
                        {driver.status_reason && (
                          <div className="text-[10px] text-slate-400 italic mt-1 max-w-[140px] truncate" title={driver.status_reason}>
                            {driver.status_reason}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Tooltip title="View Details">
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => {
                                setSelectedDriver(driver);
                                setDetailsModalVisible(true);
                              }}
                              className="rounded-lg text-xs"
                            />
                          </Tooltip>

                          {isPending && (
                            <>
                              <Tooltip title="Approve Vehicle & Driver">
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  onClick={() => handleStatusChange(driver, 'ACTIVE', 'Approve Delivery Partner')}
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
                                  onClick={() => handleStatusChange(driver, 'BLOCKED', 'Reject Application')}
                                  className="rounded-lg text-xs"
                                >
                                  Reject
                                </Button>
                              </Tooltip>
                            </>
                          )}

                          {isActive && (
                            <>
                              <Tooltip title="Suspend Driver">
                                <Button
                                  size="small"
                                  onClick={() => handleStatusChange(driver, 'SUSPENDED', 'Suspend Delivery Partner')}
                                  className="rounded-lg text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                  Suspend
                                </Button>
                              </Tooltip>
                              <Tooltip title="Block Partner">
                                <Button
                                  size="small"
                                  danger
                                  icon={<StopOutlined />}
                                  onClick={() => handleStatusChange(driver, 'BLOCKED', 'Block Delivery Partner')}
                                  className="rounded-lg text-xs"
                                >
                                  Block
                                </Button>
                              </Tooltip>
                            </>
                          )}

                          {isSuspended && (
                            <Tooltip title="Unsuspend Driver">
                              <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                onClick={() => handleStatusChange(driver, 'ACTIVE', 'Unsuspend Delivery Partner')}
                                className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                              >
                                Unsuspend
                              </Button>
                            </Tooltip>
                          )}

                          {isBlocked && (
                            <Tooltip title="Unblock Driver">
                              <Button
                                size="small"
                                type="primary"
                                icon={<SafetyCertificateOutlined />}
                                onClick={() => handleStatusChange(driver, 'ACTIVE', 'Unblock Delivery Partner')}
                                className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                              >
                                Unblock
                              </Button>
                            </Tooltip>
                          )}

                          {!isDeleted && (
                            <Tooltip title="Soft-delete Driver">
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleSoftDelete(driver)}
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

      {/* Driver Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <CarOutlined className="text-[#FF521C]" />
            <span>Driver Profile: {selectedDriver?.name}</span>
          </div>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)} className="rounded-xl">
            Close
          </Button>
        ]}
        width={560}
      >
        {selectedDriver && (
          <div className="space-y-4 py-3 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Driver ID</span>
                <p className="font-mono text-slate-800 font-bold mt-0.5">{selectedDriver.id}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                <div className="mt-0.5">{getStatusBadge(selectedDriver.status, selectedDriver.is_active)}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Type</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedDriver.vehicle_type || 'Motorcycle'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Registration No</span>
                <p className="font-mono text-slate-800 font-bold mt-0.5">{selectedDriver.vehicle_number || selectedDriver.vehicle_license || 'MH 12 AB 1234'}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Email</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedDriver.email}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</span>
                <p className="font-semibold text-slate-800 mt-0.5">{selectedDriver.phone || '+91 98765 00000'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
