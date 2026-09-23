import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../../api/axios';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  ShopOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Input, message, Modal } from 'antd';

const PAGE_SIZE = 9;

function ApprovalCardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-soft animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-100" />
        <div className="flex-1">
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-5 h-3 bg-gray-100 rounded w-full" />
      <div className="mt-3 h-3 bg-gray-100 rounded w-5/6" />
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="h-9 bg-gray-100 rounded-xl" />
        <div className="h-9 bg-gray-100 rounded-xl" />
        <div className="h-9 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function getInitial(name = '') {
  return name.trim().charAt(0).toUpperCase() || 'U';
}

function InfoLine({ label, value }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <span className="text-[10px] uppercase tracking-[0.14em] text-gray-400 font-black">{label}</span>
      <span className="text-sm font-semibold text-gray-700 break-all">{value || 'Not provided'}</span>
    </div>
  );
}

export default function PendingApprovals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, sortBy, searchTerm]);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/admin/pending-approvals', {
        params: {
          page: currentPage,
          limit: PAGE_SIZE,
          type: typeFilter,
          search: searchTerm,
          sort: sortBy
        }
      });

      if (data.success) {
        setItems(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalItems(data.pagination?.total || 0);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy, typeFilter]);

  useEffect(() => {
    fetchPendingApprovals();
  }, [fetchPendingApprovals]);

  const refreshAfterAction = async () => {
    if (items.length === 1 && currentPage > 1) {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
      return;
    }
    await fetchPendingApprovals();
  };

  const openDetails = async (id) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setSelectedDetails(null);

    try {
      const { data } = await axios.get(`/admin/pending-approvals/${id}`);
      if (data.success) {
        setSelectedDetails(data.data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const confirmApprove = (item) => {
    Modal.confirm({
      title: 'Approve this request?',
      content: `Approve ${item.name} as ${item.type === 'driver' ? 'Driver' : 'Restaurant'} account?`,
      okText: 'Approve',
      cancelText: 'Cancel',
      okButtonProps: { className: 'bg-green-600 hover:!bg-green-700' },
      onOk: async () => {
        try {
          setActionLoadingId(item.id);
          await axios.patch(`/admin/pending-approvals/${item.id}/approve`);
          message.success('Request approved successfully');
          setItems((prev) => prev.filter((entry) => entry.id !== item.id));
          await refreshAfterAction();
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to approve request');
        } finally {
          setActionLoadingId('');
        }
      }
    });
  };

  const openRejectModal = (item) => {
    setRejectTarget(item);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const submitReject = async () => {
    if (!rejectTarget) return;

    try {
      setActionLoadingId(rejectTarget.id);
      await axios.patch(`/admin/pending-approvals/${rejectTarget.id}/reject`, {
        reason: rejectReason || null
      });
      message.success('Request rejected successfully');
      setItems((prev) => prev.filter((entry) => entry.id !== rejectTarget.id));
      setIsRejectModalOpen(false);
      setRejectTarget(null);
      setRejectReason('');
      await refreshAfterAction();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoadingId('');
    }
  };

  const pageNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 1; i <= totalPages; i += 1) {
      numbers.push(i);
    }
    return numbers;
  }, [totalPages]);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto p-4 md:p-0">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Pending Approvals</h1>
          <p className="text-gray-500 font-medium mt-1">Review registration requests from Drivers and Restaurants</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-soft flex items-center gap-2 w-fit">
          <ClockCircleOutlined className="text-amber-500" />
          <span className="text-xs uppercase tracking-[0.16em] font-black text-gray-500">Pending: {totalItems}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-4 md:p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Input
              allowClear
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email"
              prefix={<SearchOutlined className="text-gray-300" />}
              className="h-11 rounded-xl"
            />
          </div>

          <select
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 outline-none focus:border-primary"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="driver">Driver</option>
            <option value="restaurant">Restaurant</option>
          </select>

          <select
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 outline-none focus:border-primary"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <ApprovalCardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-soft py-24 text-center">
          <h3 className="text-xl font-black text-gray-700 mb-2">No pending approvals</h3>
          <p className="text-sm text-gray-400 font-medium">Try changing your filters or search terms.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => openDetails(item.id)}
                className="bg-white rounded-3xl border border-gray-100 shadow-soft p-5 cursor-pointer hover:shadow-lg transition-all"
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') openDetails(item.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 overflow-hidden">
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitial(item.name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 truncate">{item.email}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    item.type === 'driver'
                      ? 'bg-teal-100 text-teal-700 border-teal-200'
                      : 'bg-orange-100 text-orange-700 border-orange-200'
                  }`}>
                    {item.type === 'driver' ? 'Driver' : 'Restaurant'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-black">Created</p>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <p className="text-[10px] text-amber-500 uppercase tracking-wider font-black">Status</p>
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">Pending</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      confirmApprove(item);
                    }}
                    disabled={actionLoadingId === item.id}
                    className="h-9 rounded-xl text-[11px] font-black uppercase tracking-wider bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 disabled:opacity-50"
                  >
                    <CheckCircleOutlined /> Approve
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      openRejectModal(item);
                    }}
                    disabled={actionLoadingId === item.id}
                    className="h-9 rounded-xl text-[11px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 disabled:opacity-50"
                  >
                    <CloseCircleOutlined /> Reject
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      openDetails(item.id);
                    }}
                    className="h-9 rounded-xl text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
                  >
                    <EyeOutlined /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-soft p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <p className="text-xs font-semibold text-gray-500">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalItems)} of {totalItems} requests
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-9 min-w-9 px-2 rounded-lg border text-xs font-black ${
                    page === currentPage
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="h-9 px-3 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <Modal
        open={detailsOpen}
        onCancel={() => setDetailsOpen(false)}
        footer={null}
        width={820}
        title={<span className="text-lg font-black text-gray-800">Approval Details</span>}
      >
        {detailsLoading ? (
          <div className="py-20 text-center text-gray-500">Loading details...</div>
        ) : !selectedDetails ? (
          <div className="py-20 text-center text-gray-500">No details found.</div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20">
                  {selectedDetails.type === 'driver' ? <UserOutlined /> : <ShopOutlined />}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-gray-800 truncate">{selectedDetails.name}</p>
                  <p className="text-xs text-gray-400 truncate">{selectedDetails.email}</p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                Pending
              </span>
            </div>

            {selectedDetails.type === 'driver' ? (
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-gray-500">Driver Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoLine label="Full Name" value={selectedDetails.details?.user?.full_name} />
                  <InfoLine label="Email" value={selectedDetails.details?.user?.email} />
                  <InfoLine label="Phone" value={selectedDetails.details?.user?.phone_number} />
                  <InfoLine label="ID / CCCD" value={selectedDetails.details?.driver?.id_cccd} />
                  <InfoLine label="Driver License" value={selectedDetails.details?.driver?.driver_license} />
                  <InfoLine label="Vehicle Info" value={selectedDetails.details?.driver?.vehicle_info} />
                </div>

                <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400 mb-2">Uploaded Documents</p>
                  <p className="text-sm text-gray-500">No document previews available.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-gray-500">Restaurant Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoLine label="Restaurant Name" value={selectedDetails.details?.restaurant?.restaurant_name} />
                  <InfoLine label="Owner Name" value={selectedDetails.details?.restaurant?.owner_name} />
                  <InfoLine label="Email" value={selectedDetails.details?.restaurant?.email} />
                  <InfoLine label="Phone" value={selectedDetails.details?.restaurant?.phone} />
                  <InfoLine label="Address" value={selectedDetails.details?.restaurant?.address} />
                  <InfoLine label="Business License" value={selectedDetails.details?.restaurant?.business_license} />
                </div>

                <div className="p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-400 mb-2">Images / Menu</p>
                  <p className="text-sm text-gray-500">No image or menu previews available.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={isRejectModalOpen}
        title={<span className="text-lg font-black text-gray-800">Reject Request</span>}
        onCancel={() => {
          setIsRejectModalOpen(false);
          setRejectTarget(null);
          setRejectReason('');
        }}
        onOk={submitReject}
        okText="Reject"
        okButtonProps={{
          danger: true,
          loading: rejectTarget?.id === actionLoadingId
        }}
      >
        <p className="text-sm text-gray-600 mb-3">Add an optional rejection reason:</p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Reason (optional)"
          maxLength={300}
        />
      </Modal>
    </div>
  );
}
