import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI } from '../services/api';
import { formatDateTime, getStatusConfig } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ApplicationTracking() {
  const { isAuthenticated, user } = useAuth();
  const [searchName, setSearchName] = useState('');
  const [assistanceTypeId, setAssistanceTypeId] = useState('');
  const [assistanceTypes, setAssistanceTypes] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchAssistanceTypes();
  }, []);

  const fetchAssistanceTypes = async () => {
    try {
      const res = await applicationsAPI.publicAssistanceTypes();
      setAssistanceTypes(res.data.assistance_types);
    } catch (err) {
      console.error('Failed to load assistance types', err);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!searchName.trim() || !assistanceTypeId) {
      toast.error('Please enter your name and select an assistance type.');
      return;
    }

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await applicationsAPI.trackSearch({
        name: searchName.trim(),
        assistance_type_id: assistanceTypeId
      });
      setResult(res.data.application);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to track application.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
        padding: 'var(--space-3xl) var(--space-xl)',
        textAlign: 'center',
        color: 'white',
      }}>
        <Link 
          to={isAuthenticated ? (user?.role === 'citizen' ? '/citizen' : '/admin') : '/'} 
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-sm)', display: 'inline-block', marginBottom: 'var(--space-md)' }}
        >
          ← Back to Home
        </Link>
        <h1 style={{ color: 'white', marginBottom: 'var(--space-sm)' }}>Track Your Application</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>Enter your name and select the assistance type to check the status</p>
      </div>

      <div className="tracking-container">
        {/* Search Form */}
        <div className="card" style={{ marginBottom: 'var(--space-2xl)', padding: 'var(--space-xl)' }}>
          <form onSubmit={handleTrack}>
            <div className="grid grid-2" style={{ gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Juan Dela Cruz"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type of Assistance</label>
                <select
                  className="form-input"
                  value={assistanceTypeId}
                  onChange={(e) => setAssistanceTypeId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Select Assistance Type...</option>
                  {assistanceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading} 
              style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            >
              {loading ? 'Searching...' : '🔍 Check Application Status'}
            </button>
          </form>
        </div>

        {/* Not Found */}
        {notFound && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔎</div>
              <h3>Application Not Found</h3>
              <p>No application found for <strong>{searchName}</strong> under this assistance category. Please check your details and try again.</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="animate-fade-in">
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'monospace', margin: 0 }}>
                    REF: {result.reference_id}
                  </p>
                  <h3 style={{ margin: '4px 0', fontSize: '1.25rem' }}>{result.assistance_type}</h3>
                </div>
                <span className={`badge badge-dot badge-${getStatusConfig(result.status).color}`} style={{ fontSize: 'var(--font-size-sm)', padding: '6px 16px' }}>
                  {getStatusConfig(result.status).icon} {getStatusConfig(result.status).label}
                </span>
              </div>

              <div className="grid grid-3" style={{ marginTop: 'var(--space-lg)', gap: 'var(--space-md)', background: 'var(--bg-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Date Submitted</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, margin: 0 }}>{formatDateTime(result.submitted_at)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Queue Position</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, margin: 0, color: 'var(--primary-600)' }}>{result.queue_position || 'Not in queue yet'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Last Updated</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, margin: 0 }}>{formatDateTime(result.reviewed_at) || formatDateTime(result.submitted_at)}</p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            {result.status_history && result.status_history.length > 0 && (
              <div className="card">
                <h4 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⏳</span> Status Timeline
                </h4>
                <div className="tracking-timeline">
                  {result.status_history.map((entry, i) => (
                    <div key={i} className="timeline-item">
                      <p className="timeline-item-date">{formatDateTime(entry.date)}</p>
                      <p className="timeline-item-status" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {entry.from && <span style={{ opacity: 0.6, fontSize: '0.8em' }}>{getStatusConfig(entry.from).label} →</span>}
                        <span style={{ fontWeight: 700 }}>{getStatusConfig(entry.to).label}</span>
                      </p>
                      {entry.remarks && (
                        <p className="timeline-item-remarks" style={{ 
                          background: 'var(--bg-tertiary)', 
                          padding: '8px 12px', 
                          borderRadius: '8px',
                          marginTop: '8px',
                          fontSize: '0.85rem'
                        }}>{entry.remarks}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
