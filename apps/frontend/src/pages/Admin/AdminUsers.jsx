import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import socket from '../../socket';
import { notification, Modal, Tag, Input, Select, Button, Tooltip, Empty, Spin } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  StopOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  LockOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/users');
      if (response.data.success && Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      notification.error({
        title: 'Failed to load users',
        description: error.response?.data?.message || error.message,
        placement: 'topRight'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    socket.connect();
    socket.emit('join_admin');
    socket.emit('join', 'role_admin');

    const handleUserEvent = () => {
      fetchUsers();
    };

    socket.on('NEW_USER_REGISTERED', handleUserEvent);
    socket.on('USER_REGISTERED', handleUserEvent);
    socket.on('USER_STATUS_UPDATED', handleUserEvent);
    socket.on('USER_UPDATED', handleUserEvent);

    return () => {
      socket.off('NEW_USER_REGISTERED', handleUserEvent);
      socket.off('USER_REGISTERED', handleUserEvent);
      socket.off('USER_STATUS_UPDATED', handleUserEvent);
      socket.off('USER_UPDATED', handleUserEvent);
    };
  }, []);

  const handleStatusChange = (user, nextStatus, title) => {
    if (user.role === 'admin') {
      notification.warning({
        title: 'Action Restricted',
        description: 'System administrators cannot be modified or suspended.',
        placement: 'topRight'
      });
      return;
    }

    let reasonText = '';
    Modal.confirm({
      title: `${title} - ${user.full_name || user.email}`,
      icon: <ExclamationCircleOutlined className="text-orange-500" />,
      content: (
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-600">
            Change account status to <span className="font-bold text-slate-900">{nextStatus}</span> for <span className="font-bold">{user.full_name || user.email}</span>?
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
          const response = await axios.put(`/admin/users/${user.id}/status`, {
            status: nextStatus,
            reason: reasonText || `Admin set status to ${nextStatus}`
          });
          if (response.data.success) {
            notification.success({
              title: 'User Status Updated',
              description: `${user.full_name || user.email} is now ${nextStatus}.`,
              placement: 'topRight'
            });
            fetchUsers();
          }
        } catch (error) {
          notification.error({
            title: 'Status Update Failed',
            description: error.response?.data?.message || error.message,
            placement: 'topRight'
          });
        }
      }
    });
  };

  const handleSoftDelete = (user) => {
    if (user.role === 'admin') {
      notification.warning({
        title: 'Action Restricted',
        description: 'System administrators cannot be deleted or archived.',
        placement: 'topRight'
      });
      return;
    }

    let reasonText = '';
    Modal.confirm({
      title: `Archive User Account - ${user.full_name || user.email}`,
      icon: <DeleteOutlined className="text-red-500" />,
      content: (
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-600">
            This will <span className="font-bold text-red-600">soft-delete</span> this user. Historical orders, payments, and feedback records will remain intact.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Reason for Deletion:
            </label>
            <TextArea
              rows={3}
              placeholder="e.g., Requested account closure / Policy violation"
              onChange={(e) => { reasonText = e.target.value; }}
              className="text-xs rounded-lg"
            />
          </div>
        </div>
      ),
      okText: 'Archive Account',
      okButtonProps: { danger: true },
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await axios.delete(`/admin/users/${user.id}`, {
            data: { reason: reasonText || 'Archived by administrator' }
          });
          if (response.data.success) {
            notification.success({
              title: 'Account Archived',
              description: `${user.full_name || user.email} was successfully archived.`,
              placement: 'topRight'
            });
            fetchUsers();
          }
        } catch (error) {
          notification.error({
            title: 'Archival Failed',
            description: error.response?.data?.message || error.message,
            placement: 'topRight'
          });
        }
      }
    });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Admin</span>;
      case 'restaurant':
        return <span className="bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Restaurant</span>;
      case 'delivery_partner':
        return <span className="bg-teal-100 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Driver</span>;
      case 'customer_support':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Support</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Customer</span>;
    }
  };

  const getAccountStatusBadge = (user) => {
    if (user.deleted_at || user.status === 'DELETED') {
      return <span className="bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Archived</span>;
    }
    if (user.is_blocked || user.status === 'blocked' || user.status === 'BLOCKED') {
      return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Blocked</span>;
    }
    if (user.status === 'suspended' || user.status === 'SUSPENDED') {
      return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Suspended</span>;
    }
    return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>;
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.phone_number && u.phone_number.includes(searchTerm));

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = !u.is_blocked && !u.deleted_at && u.status !== 'blocked' && u.status !== 'suspended';
      } else if (statusFilter === 'blocked') {
        matchesStatus = u.is_blocked || u.status === 'blocked';
      } else if (statusFilter === 'suspended') {
        matchesStatus = u.status === 'suspended';
      } else if (statusFilter === 'deleted') {
        matchesStatus = Boolean(u.deleted_at || u.status === 'DELETED');
      }

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime());

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserOutlined className="text-[#FF521C]" />
            User Management & Access Control
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Manage all platform users, roles, account statuses, and system credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
            loading={loading}
            className="rounded-xl font-semibold text-xs border-slate-200 hover:border-[#FF521C] hover:text-[#FF521C]"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Input
            prefix={<SearchOutlined className="text-slate-400 mr-1" />}
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
            className="rounded-xl text-xs py-2 border-slate-200 focus:border-[#FF521C]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <FilterOutlined /> Role:
          </div>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            className="w-36 text-xs"
          >
            <Option value="ALL">All Roles</Option>
            <Option value="customer">Customers</Option>
            <Option value="restaurant">Restaurants</Option>
            <Option value="delivery_partner">Drivers</Option>
            <Option value="admin">Admins</Option>
          </Select>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 ml-2">
            Status:
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-36 text-xs"
          >
            <Option value="ALL">All Statuses</Option>
            <Option value="active">Active</Option>
            <Option value="suspended">Suspended</Option>
            <Option value="blocked">Blocked</Option>
            <Option value="deleted">Archived</Option>
          </Select>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <Spin size="large" />
          <p className="text-xs text-slate-500 mt-3">Loading users from database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
          <Empty description={<span className="text-xs text-slate-500 font-medium">No users match your criteria</span>} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const isBlocked = u.is_blocked || u.status === 'blocked';
                  const isSuspended = u.status === 'suspended';
                  const isDeleted = Boolean(u.deleted_at || u.status === 'DELETED');
                  const isActive = !isBlocked && !isSuspended && !isDeleted;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {u.full_name || 'Anonymous User'}
                              {isAdmin && (
                                <Tooltip title="Protected Administrator Account">
                                  <LockOutlined className="text-purple-600 text-xs" />
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="text-[11px] text-slate-700 flex items-center gap-1.5">
                          <MailOutlined className="text-slate-400" />
                          {u.email}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <PhoneOutlined className="text-slate-400" />
                          {u.phone_number || 'N/A'}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-4 px-4">
                        {getAccountStatusBadge(u)}
                        {u.status_reason && (
                          <div className="text-[10px] text-slate-400 italic mt-1 max-w-[130px] truncate" title={u.status_reason}>
                            {u.status_reason}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        {isAdmin ? (
                          <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                            Admin Protected
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {isActive && (
                              <>
                                <Tooltip title="Suspend Access">
                                  <Button
                                    size="small"
                                    onClick={() => handleStatusChange(u, 'suspended', 'Suspend User')}
                                    className="rounded-lg text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                  >
                                    Suspend
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Block Account">
                                  <Button
                                    size="small"
                                    danger
                                    icon={<StopOutlined />}
                                    onClick={() => handleStatusChange(u, 'blocked', 'Block User')}
                                    className="rounded-lg text-xs"
                                  >
                                    Block
                                  </Button>
                                </Tooltip>
                              </>
                            )}

                            {(isSuspended || isBlocked) && (
                              <Tooltip title="Restore & Activate">
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<CheckCircleOutlined />}
                                  onClick={() => handleStatusChange(u, 'active', 'Restore Account')}
                                  className="rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 border-none text-white"
                                >
                                  Activate
                                </Button>
                              </Tooltip>
                            )}

                            {!isDeleted && (
                              <Tooltip title="Soft-delete Account">
                                <Button
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleSoftDelete(u)}
                                  className="rounded-lg text-xs text-slate-400 hover:text-red-600 border-slate-200"
                                />
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
