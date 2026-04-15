import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function AssistanceTypeManagement() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await adminAPI.listAssistanceTypes();
      setTypes(res.data.assistance_types || []);
    } catch (err) {
      toast.error('Failed to load assistance programs.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setForm({
        name: type.name,
        description: type.description || '',
        is_active: !!type.is_active
      });
    } else {
      setEditingType(null);
      setForm({ name: '', description: '', is_active: true });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingType) {
        await adminAPI.updateAssistanceType(editingType.id, form);
        toast.success('Assistance program updated!');
      } else {
        await adminAPI.createAssistanceType(form);
        toast.success('New assistance program added!');
      }
      setShowModal(false);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (type) => {
    try {
      await adminAPI.updateAssistanceType(type.id, { is_active: !type.is_active });
      toast.success(`${type.name} is now ${!type.is_active ? 'Active' : 'Inactive'}`);
      fetchTypes();
    } catch {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Assistance Programs</h1>
          <p className="page-header-subtitle">Manage the different types of aid provided by your barangay</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          ➕ Add New Program
        </button>
      </div>

      <div className="grid grid-3">
        {loading ? (
          <div className="loader"><div className="loader-spinner" /></div>
        ) : types.length === 0 ? (
          <div className="card" style={{ gridColumn: 'span 3' }}>
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No Programs Defined</h3>
              <p>You haven't added any assistance programs yet. Click "Add New Program" to get started.</p>
            </div>
          </div>
        ) : (
          types.map(type => (
            <div key={type.id} className={`card ${!type.is_active ? 'opacity-75' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                <span className={`badge ${type.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(type)}>Edit</button>
                  <button 
                    className={`btn btn-sm ${type.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                    onClick={() => toggleStatus(type)}
                  >
                    {type.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
              <h3 style={{ marginBottom: 'var(--space-xs)' }}>{type.name}</h3>
              <p style={{ 
                fontSize: 'var(--font-size-sm)', 
                color: 'var(--text-secondary)',
                minHeight: '4.8em',
                lineHeight: '1.6'
              }}>
                {type.description || 'No description provided.'}
              </p>
              <div style={{ 
                marginTop: 'var(--space-lg)', 
                paddingTop: 'var(--space-md)', 
                borderTop: '1px solid var(--border-color)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)'
              }}>
                Created on {new Date(type.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingType ? 'Edit Assistance Program' : 'Add New Assistance Program'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Program Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g., Financial Assistance" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Detail the requirements and coverage of this program..."
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label className="form-checkbox">
                    <input 
                      type="checkbox" 
                      checked={form.is_active}
                      onChange={e => setForm({...form, is_active: e.target.checked})}
                    />
                    Mark as currently active
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingType ? 'Save Changes' : 'Create Program')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
