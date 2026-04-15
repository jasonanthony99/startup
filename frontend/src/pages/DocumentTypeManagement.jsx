import { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SubscriptionUpsell from '../components/common/SubscriptionUpsell';
import toast from 'react-hot-toast';

export default function DocumentTypeManagement() {
  const { user } = useAuth();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | { editing object }
  const [form, setForm] = useState({ name: '', description: '', fee: '', requirements: '', processing_time: '1-3 business days' });
  const [submitting, setSubmitting] = useState(false);

  // Return upsell screen if tenant is not subscribed
  if (!user?.tenant?.is_subscribed) {
    return <SubscriptionUpsell />;
  }

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try {
      const res = await documentAPI.adminTypes();
      setTypes(res.data.document_types || []);
    } catch {
      toast.error('Failed to load document types.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ name: '', description: '', fee: '', requirements: '', processing_time: '1-3 business days' });
    setModal('create');
  };

  const openEdit = (type) => {
    setForm({
      name: type.name,
      description: type.description || '',
      fee: type.fee,
      requirements: type.requirements || '',
      processing_time: type.processing_time || '',
    });
    setModal(type);
  };

  const handleSubmit = async () => {
    if (!form.name || form.fee === '') return;
    setSubmitting(true);
    try {
      if (modal === 'create') {
        await documentAPI.createType(form);
        toast.success('Document type created!');
      } else {
        await documentAPI.updateType(modal.id, form);
        toast.success('Document type updated!');
      }
      setModal(null);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (type) => {
    try {
      await documentAPI.updateType(type.id, { is_active: !type.is_active });
      toast.success(`${type.name} ${type.is_active ? 'disabled' : 'enabled'}.`);
      fetchTypes();
    } catch {
      toast.error('Failed to update.');
    }
  };

  if (loading) return <div className="loader"><div className="loader-spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>📋 Document Types</h1>
          <p className="page-header-subtitle">Manage available document types and their fees</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          ➕ Add Document Type
        </button>
      </div>

      {types.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Document Types</h3>
            <p>Create your first document type to start accepting requests from residents.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-3">
          {types.map(type => (
            <div key={type.id} className="card" style={{ opacity: type.is_active ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                <h3 style={{ fontSize: 'var(--font-size-base)', margin: 0 }}>{type.name}</h3>
                <span className={`badge badge-${type.is_active ? 'approved' : 'rejected'}`}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {type.description && (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
                  {type.description}
                </p>
              )}
              <div style={{ marginBottom: 'var(--space-sm)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Fee</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-500)' }}>
                  {parseFloat(type.fee) > 0 ? `₱${parseFloat(type.fee).toFixed(2)}` : 'FREE'}
                </span>
              </div>
              <div style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Processing</span>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{type.processing_time}</span>
              </div>
              {type.requirements && (
                <div style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-sm)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  <strong>Requirements:</strong> {type.requirements}
                </div>
              )}
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(type)}>✏️ Edit</button>
                <button className={`btn ${type.is_active ? 'btn-danger' : 'btn-success'} btn-sm`}
                  style={{ flex: 1 }}
                  onClick={() => handleToggle(type)}>
                  {type.is_active ? '🚫 Disable' : '✅ Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'create' ? 'Add Document Type' : 'Edit Document Type'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" placeholder="e.g., Barangay Clearance"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" placeholder="Brief description of the document..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fee (₱) *</label>
                  <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Processing Time</label>
                  <input className="form-input" placeholder="e.g., 1-3 business days"
                    value={form.processing_time} onChange={e => setForm({ ...form, processing_time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Requirements</label>
                <textarea className="form-textarea" placeholder="e.g., Valid ID, 1x1 Photo, Cedula..."
                  value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}
                disabled={submitting || !form.name || form.fee === ''}>
                {submitting ? 'Saving...' : modal === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
