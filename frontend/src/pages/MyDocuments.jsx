import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusConfig = {
  pending_payment: { label: 'Pending Payment', color: 'gold', icon: '💳' },
  paid: { label: 'Paid', color: 'blue', icon: '✅' },
  processing: { label: 'Processing', color: 'blue', icon: '⏳' },
  ready: { label: 'Ready for Pickup', color: 'green', icon: '📦' },
  released: { label: 'Released', color: 'purple', icon: '🎉' },
  rejected: { label: 'Rejected', color: 'red', icon: '❌' },
};

export default function MyDocuments() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [payingId, setPayingId] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Return locked screen if tenant is not subscribed
  if (!user?.tenant?.is_subscribed) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔒</div>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Feature Locked</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
          The Barangay Document Requesting feature is currently locked because your barangay is not subscribed to the premium plan. Please contact your barangay hall for more information.
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Handle auto-opening from notification highlight
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && requests.length > 0) {
      const match = requests.find(r => r.id.toString() === highlightId);
      if (match) setSelectedReq(match);
    }
  }, [searchParams, requests]);

  const closeModal = () => {
    setSelectedReq(null);
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

  const handlePayment = async () => {
    if (!paymentMethod || !payModal) return;
    setPayingId(payModal.id);
    try {
      await documentAPI.simulatePayment(payModal.id, { payment_method: paymentMethod });
      toast.success('Payment successful! Document is now being processed.');
      setPayModal(null);
      setPaymentMethod(null);
      fetchRequests();
    } catch (err) {
      toast.error('Payment failed.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>📄 My Documents</h1>
          <p className="page-header-subtitle">Track your document requests and payments</p>
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

      {/* List */}
      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : requests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Document Requests</h3>
            <p>You haven't requested any documents yet.</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Document</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const sc = statusConfig[req.status] || { label: req.status, color: 'gray' };
                  return (
                    <tr key={req.id}>
                      <td><code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary-500)' }}>{req.reference_id}</code></td>
                      <td>{req.document_type?.name || '—'}</td>
                      <td style={{ fontWeight: 600 }}>₱{parseFloat(req.amount).toFixed(2)}</td>
                      <td><span className={`badge badge-dot badge-${sc.color}`}>{sc.label}</span></td>
                      <td>
                        <span className={`badge badge-${req.payment_status === 'paid' ? 'approved' : 'pending'}`}>
                          {req.payment_status === 'paid' ? '✅ Paid' : '⏳ Unpaid'}
                        </span>
                      </td>
                      <td>{formatDate(req.created_at)}</td>
                      <td style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedReq(req)}>Details</button>
                        {req.status === 'pending_payment' && (
                          <button className="btn btn-primary btn-sm" onClick={() => { setPayModal(req); setPaymentMethod(null); }}>
                            Pay
                          </button>
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

      {/* Detail Modal */}
      {selectedReq && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <div>
                <h3>Document Request Details</h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{selectedReq.reference_id}</p>
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <label className="form-label">Document</label>
                  <p style={{ fontSize: 'var(--font-size-sm)' }}>{selectedReq.document_type?.name}</p>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`badge badge-dot badge-${statusConfig[selectedReq.status]?.color}`}>
                    {statusConfig[selectedReq.status]?.label}
                  </span>
                </div>
                <div>
                  <label className="form-label">Amount</label>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>₱{parseFloat(selectedReq.amount).toFixed(2)}</p>
                </div>
                <div>
                  <label className="form-label">Payment</label>
                  <p style={{ fontSize: 'var(--font-size-sm)' }}>
                    {selectedReq.payment_status === 'paid'
                      ? `✅ Paid via ${(selectedReq.payment_method || '').toUpperCase()}`
                      : '⏳ Unpaid'}
                  </p>
                </div>
                {selectedReq.pickup_date && (
                  <div>
                    <label className="form-label">Pickup Date</label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--accent-green)', fontWeight: 600 }}>
                      📅 {formatDate(selectedReq.pickup_date)}
                    </p>
                  </div>
                )}
                {selectedReq.purpose && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Purpose</label>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{selectedReq.purpose}</p>
                  </div>
                )}
              </div>
              {selectedReq.admin_remarks && (
                <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <label className="form-label">Admin Remarks</label>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{selectedReq.admin_remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="modal-backdrop" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>💳 Pay for Document</h3>
              <button className="modal-close" onClick={() => setPayModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                {payModal.document_type?.name} — {payModal.reference_id}
              </p>
              <div style={{ textAlign: 'center', margin: 'var(--space-lg) 0', fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--primary-500)' }}>
                ₱{parseFloat(payModal.amount).toFixed(2)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                {[
                  { key: 'gcash', label: 'GCash', color: '#007bff', letter: 'G' },
                  { key: 'paymaya', label: 'Maya', color: '#019a01', letter: 'M' },
                ].map(m => (
                  <div key={m.key} onClick={() => setPaymentMethod(m.key)} style={{
                    padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${paymentMethod === m.key ? m.color : 'var(--border-color)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 800,
                    }}>{m.letter}</div>
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    {paymentMethod === m.key && <span style={{ marginLeft: 'auto', color: m.color }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={!paymentMethod || payingId === payModal.id} onClick={handlePayment}>
                {payingId === payModal.id ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
