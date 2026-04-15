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

      <div className="grid grid-2" style={{ gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Left Side: Form */}
        <div className="card">
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xs)' }}>
                <p className="form-hint">{form.purpose.length}/1000 characters</p>
              </div>
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

            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/citizen')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} id="submit-application">
                {loading ? 'Submitting...' : '📝 Submit Application'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Showcase & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {/* Dynamic Showcase Card */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
            {form.assistance_type_id ? (
              <div className="animate-fade-in">
                {/* Hero Image Section */}
                <div style={{ 
                  height: '220px', 
                  position: 'relative',
                  background: 'var(--primary-900)',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={`/assets/banners/${
                      types.find(t => t.id == form.assistance_type_id)?.name.toLowerCase().includes('medical') ? 'medical' :
                      types.find(t => t.id == form.assistance_type_id)?.name.toLowerCase().includes('financial') ? 'financial' :
                      types.find(t => t.id == form.assistance_type_id)?.name.toLowerCase().includes('food') ? 'food' :
                      types.find(t => t.id == form.assistance_type_id)?.name.toLowerCase().includes('educational') ? 'educational' :
                      types.find(t => t.id == form.assistance_type_id)?.name.toLowerCase().includes('burial') ? 'burial' :
                      types.find(t => t.id == form.assistance_type_id)?.name.toLowerCase().includes('disaster') ? 'disaster' :
                      'medical' // fallback
                    }.png`}
                    alt="Program"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                    display: 'flex', alignItems: 'flex-end', padding: 'var(--space-xl)'
                  }}>
                    <div className="badge badge-gold" style={{ marginBottom: 'var(--space-xs)' }}>
                      ⭐ Featured Program
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div style={{ padding: 'var(--space-xl)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                    <div>
                      <h2 style={{ color: 'var(--primary-700)', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {types.find(t => t.id == form.assistance_type_id)?.name}
                      </h2>
                      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        <span>🏛️ Official Barangay Program</span>
                        <span>✅ Fully Verified</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: 'var(--space-lg)', 
                    background: 'var(--bg-tertiary)', 
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--primary-500)',
                    marginBottom: 'var(--space-lg)'
                  }}>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-primary)', fontSize: '1rem' }}>
                      {types.find(t => t.id == form.assistance_type_id)?.description}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-sm)' }}>
                      <span style={{ fontSize: '1.2rem' }}>🤝</span>
                      <div>
                        <strong>Community Support</strong>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Priority for residents</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-sm)' }}>
                      <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                      <div>
                        <strong>Secure Process</strong>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Encrypted submission</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-3xl)', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)', opacity: 0.2 }}>📋</div>
                <h3 style={{ color: 'var(--text-secondary)' }}>Select a Program</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', maxWidth: '250px', margin: '0 auto' }}>
                  Choose a type of assistance to see how the Barangay can support you.
                </p>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div style={{
            padding: 'var(--space-xl)',
            background: 'linear-gradient(135deg, var(--primary-50), white)',
            border: '1px solid var(--primary-100)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h4 style={{ fontSize: 'var(--font-size-base)', color: 'var(--primary-700)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span>ℹ️</span> Process Overview
            </h4>
            <ul style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              paddingLeft: 'var(--space-lg)',
              lineHeight: '2',
            }}>
              <li><strong>Trackable</strong>: Get a unique ID to monitor progress</li>
              <li><strong>Fair</strong>: Automated priority scoring system</li>
              <li><strong>Fast</strong>: Real-time digital review process</li>
              <li><strong>Smart</strong>: Instant status change notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
