import { useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { formatDateTime, getStatusConfig } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ApplicationTracking() {
  const [refId, setRefId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!refId.trim()) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await applicationsAPI.track(refId.trim());
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
        <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-sm)', display: 'inline-block', marginBottom: 'var(--space-md)' }}>
          ← Back to Home
        </Link>
        <h1 style={{ color: 'white', marginBottom: 'var(--space-sm)' }}>Track Your Application</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)' }}>Enter your reference ID to check the status</p>
      </div>

      <div className="tracking-container">
        {/* Search Form */}
        <form onSubmit={handleTrack} style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter Reference ID (e.g., BRG-1-20240101-ABC123)"
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              style={{ flex: 1 }}
              id="track-input"
            />
            <button type="submit" className="btn btn-primary" disabled={loading} id="track-btn">
              {loading ? '...' : '🔍 Track'}
            </button>
          </div>
        </form>

        {/* Not Found */}
        {notFound && (
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>Application Not Found</h3>
              <p>No application found with reference ID: <strong>{refId}</strong>. Please check the ID and try again.</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="animate-fade-in">
            <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {result.reference_id}
                  </p>
                  <h3 style={{ margin: '4px 0' }}>{result.assistance_type}</h3>
                </div>
                <span className={`badge badge-dot badge-${getStatusConfig(result.status).color}`} style={{ fontSize: 'var(--font-size-sm)', padding: '6px 16px' }}>
                  {getStatusConfig(result.status).icon} {getStatusConfig(result.status).label}
                </span>
              </div>

              <div className="grid grid-3" style={{ marginTop: 'var(--space-lg)', gap: 'var(--space-md)' }}>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Submitted</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{formatDateTime(result.submitted_at)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Queue Position</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{result.queue_position || 'N/A'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Reviewed</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{formatDateTime(result.reviewed_at) || 'Pending'}</p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            {result.status_history && result.status_history.length > 0 && (
              <div className="card">
                <h4 style={{ marginBottom: 'var(--space-lg)' }}>Status Timeline</h4>
                <div className="tracking-timeline">
                  {result.status_history.map((entry, i) => (
                    <div key={i} className="timeline-item">
                      <p className="timeline-item-date">{formatDateTime(entry.date)}</p>
                      <p className="timeline-item-status">
                        {entry.from ? `${getStatusConfig(entry.from).label} → ` : ''}
                        {getStatusConfig(entry.to).icon} {getStatusConfig(entry.to).label}
                      </p>
                      {entry.remarks && (
                        <p className="timeline-item-remarks">{entry.remarks}</p>
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
