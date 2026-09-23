import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { useSelector } from 'react-redux';
import { UserOutlined, MailOutlined, PhoneOutlined, SafetyOutlined } from '@ant-design/icons';

export default function AdminUsers() {
  const { token } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/users', {
        params: { status: statusFilter }
      });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, statusFilter]);

  const updateUserStatus = async (userId, currentStatus) => {
    const nextStatus = !currentStatus;
    const confirmMessage = nextStatus
      ? 'Activate this account?'
      : 'Deactivate this account?';

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await axios.put(`/admin/users/${userId}/status`, { is_active: nextStatus });
      if (response.data.success) {
        // If we are in a filtered view, remove the user from the list instead of just updating
        if (statusFilter !== 'all') {
          setUsers(prev => prev.filter(user => user.id !== userId));
        } else {
          setUsers(prev => prev.map(user => (
            user.id === userId ? { ...user, is_active: nextStatus } : user
          )));
        }
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200">Admin</span>;
      case 'restaurant': return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-200">Restaurant</span>;
      case 'delivery_partner': return <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-teal-200">Driver</span>;
      default: return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-200">Customer</span>;
    }
  };

  const getAccountStatusBadge = (user) => {
    if (user.deleted_at) {
      return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200">Rejected</span>;
    }
    return user.is_active
      ? <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200">Active</span>
      : <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-200">Pending</span>;
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto p-4 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">User Management</h1>
          <p className="text-gray-500 font-medium mt-1">Manage all system users and their access roles</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white p-1.5 rounded-2xl shadow-soft border border-gray-100 flex gap-1">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'active', label: 'Active' },
            { id: 'inactive', label: 'Inactive' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                statusFilter === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Loading users...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase tracking-widest font-bold">
                  <th className="p-6">User Details</th>
                  <th className="p-6">Contact</th>
                  <th className="p-6">Role</th>
                  <th className="p-6">Account Status</th>
                  <th className="p-6">Joined Date</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {user.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-gray-800 font-bold text-sm tracking-tight">{user.full_name || 'N/A'}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MailOutlined className="text-primary text-[10px]" /> {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <PhoneOutlined className="text-secondary text-[10px]" /> {user.phone_number || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="p-6">
                      {getAccountStatusBadge(user)}
                    </td>
                    <td className="p-6">
                      <div className="text-xs text-gray-500 font-medium">
                        {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      {!user.deleted_at ? (
                        <button
                          onClick={() => updateUserStatus(user.id, user.is_active)}
                          className={`text-xs font-bold transition-colors uppercase tracking-widest ${
                            user.is_active
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400 italic">No users found.</div>
        )}
      </div>
    </div>
  );
}
