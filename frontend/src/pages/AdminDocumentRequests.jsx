import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { sendDocumentStatusEmail } from '../services/emailService';
import { useAuth } from '../context/AuthContext';
import SubscriptionUpsell from '../components/common/SubscriptionUpsell';
import toast from 'react-hot-toast';

const statusConfig = {
  pending_payment: { label: 'Pending Payment', color: 'gold' },
  paid: { label: 'Paid', color: 'blue' },
  processing: { label: 'Processing', color: 'blue' },
  ready: { label: 'Ready for Pickup', color: 'green' },
  released: { label: 'Released', color: 'purple' },
  rejected: { label: 'Rejected', color: 'red' },
};

export default function AdminDocumentRequests() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updateModal, setUpdateModal] = useState(null);
  const [form, setForm] = useState({ status: '', remarks: '', pickup_date: '' });
  const [updating, setUpdating] = useState(false);

  // Return upsell screen if tenant is not subscribed
  if (!user?.tenant?.is_subscribed) {
    return <SubscriptionUpsell />;
  }

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  // Auto-open from notification highlight
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && requests.length > 0) {
      const match = requests.find(r => r.id.toString() === highlightId);
      if (match) {
        setUpdateModal(match);
        setForm({ status: '', remarks: '', pickup_date: '' });
      }
    }
  }, [searchParams, requests]);

  const closeModal = () => {
    setUpdateModal(null);
    if (searchParams.has('highlight')) {
      searchParams.delete('highlight');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await documentAPI.list({ status: statusFilter, per_page: 50 });
      setRequests(res.data.data || []);
    } catch {
      toast.error('Failed to load document requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!form.status) return;
    setUpdating(true);
    try {
      const res = await documentAPI.updateStatus(updateModal.id, form);
      toast.success('Status updated!');

      // Send email notification for 'ready' and 'released' statuses
      if (['ready', 'released'].includes(form.status)) {
        const req = res.data.document_request || updateModal;
        const emailResult = await sendDocumentStatusEmail({
          toName: req.user?.name || updateModal.user?.name || 'Resident',
          toEmail: req.user?.email || updateModal.user?.email || '',
          documentName: req.document_type?.name || updateModal.document_type?.name || 'Document',
          referenceId: req.reference_id || updateModal.reference_id,
          status: statusConfig[form.status]?.label || form.status,
          pickupDate: form.pickup_date || '',
          remarks: form.remarks || '',
        });

        if (emailResult.success) {
          toast.success('📧 Email notification sent to resident!');
        } else {
          toast('⚠️ Status updated but email failed to send.', { icon: '⚠️' });
        }
      }

      closeModal();
      setForm({ status: '', remarks: '', pickup_date: '' });
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>📑 Document Requests</h1>
          <p className="page-header-subtitle">Manage resident document requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'Total', count: requests.length, color: 'blue', icon: '📋' },
          { label: 'Processing', count: requests.filter(r => r.status === 'processing').length, color: 'gold', icon: '⏳' },
          { label: 'Ready', count: requests.filter(r => r.status === 'ready').length, color: 'green', icon: '📦' },
          { label: 'Released', count: requests.filter(r => r.status === 'released').length, color: 'purple', icon: '🎉' },
        ].map(stat => (
          <div key={stat.label} className={`stats-card ${stat.color}`}>
            <div className="stats-card-icon">{stat.icon}</div>
            <div className="stats-card-info">
              <h3>{stat.count}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="filter-bar">
        {['all', 'pending_payment', 'processing', 'ready', 'released', 'rejected'].map(s => (
          <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : requests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Document Requests</h3>
            <p>No document requests have been submitted yet.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Resident</th>
                  <th>Document</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const sc = statusConfig[req.status] || { label: req.status, color: 'gray' };
                  return (
                    <tr key={req.id}>
                      <td><code style={{ fontSize: '11px', color: 'var(--primary-500)' }}>{req.reference_id}</code></td>
                      <td>{req.user?.name || '—'}</td>
                      <td>{req.document_type?.name || '—'}</td>
                      <td style={{ fontWeight: 600 }}>₱{parseFloat(req.amount).toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${req.payment_status === 'paid' ? 'approved' : 'pending'}`}>
                          {req.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td><span className={`badge badge-dot badge-${sc.color}`}>{sc.label}</span></td>
                      <td>{formatDate(req.created_at)}</td>
                      <td>
                        {!['released', 'rejected'].includes(req.status) && (
                          <button className="btn btn-primary btn-sm" onClick={() => {
                            setUpdateModal(req);
                            setForm({ status: '', remarks: '', pickup_date: '' });
                          }}>Update</button>
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

      {/* Update Status Modal */}
      {updateModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Document Status</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                {updateModal.reference_id} — {updateModal.user?.name} — {updateModal.document_type?.name}
              </p>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-select" value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="">Select status</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="released">Released</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {form.status === 'ready' && (
                <div className="form-group">
                  <label className="form-label">Pickup Date</label>
                  <input type="date" className="form-input" value={form.pickup_date}
                    onChange={e => setForm({ ...form, pickup_date: e.target.value })} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea className="form-textarea" placeholder="Add remarks..."
                  value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdate} disabled={updating || !form.status}>
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
