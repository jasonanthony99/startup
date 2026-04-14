import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    assistance_type_id: '',
    purpose: '',
    requirements: null,
  });

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await applicationsAPI.assistanceTypes();
        setTypes(res.data.assistance_types || []);
      } catch {
        toast.error('Failed to load assistance types.');
      }
    };
    fetchTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await applicationsAPI.create(form);
      const refId = res.data.application?.reference_id;
      toast.success(`Application submitted! Reference: ${refId}`);
      navigate('/citizen');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit application.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Apply for Assistance</h1>
          <p className="page-header-subtitle">Fill in the details below to submit your request</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="assistance-type">Type of Assistance *</label>
            <select
              id="assistance-type"
              name="assistance_type_id"
              className="form-select"
              value={form.assistance_type_id}
              onChange={handleChange}
              required
            >
              <option value="">Select type of assistance</option>
              {types.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {types.find(t => t.id == form.assistance_type_id)?.description && (
              <p className="form-hint">
                {types.find(t => t.id == form.assistance_type_id).description}
              </p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="purpose">Purpose / Reason *</label>
            <textarea
              id="purpose"
              name="purpose"
              className="form-textarea"
              placeholder="Please describe why you need this assistance and any relevant details..."
              value={form.purpose}
              onChange={handleChange}
              required
              maxLength={1000}
            />
            <p className="form-hint">{form.purpose.length}/1000 characters</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="requirements">Supporting Documents (Optional)</label>
            <input
              id="requirements"
              type="file"
              name="requirements"
              className="form-input"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              style={{ padding: '8px' }}
            />
            <p className="form-hint">Accepted: PDF, JPG, PNG (Max 5MB)</p>
          </div>

          {/* Info Box */}
          <div style={{
            padding: 'var(--space-lg)',
            background: 'var(--primary-50)',
            border: '1px solid var(--primary-100)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-xl)',
          }}>
            <h4 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--primary-700)', marginBottom: 'var(--space-sm)' }}>
              ℹ️ What happens next?
            </h4>
            <ul style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              paddingLeft: 'var(--space-lg)',
              lineHeight: '1.8',
            }}>
              <li>Your application will receive a unique reference ID for tracking</li>
              <li>A priority score will be automatically calculated based on your profile</li>
              <li>The barangay admin will review your application</li>
              <li>You will receive notifications on status changes</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/citizen')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="submit-application">
              {loading ? 'Submitting...' : '📝 Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
