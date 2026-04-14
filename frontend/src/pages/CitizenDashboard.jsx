import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { formatDate, getStatusConfig, getPriorityConfig } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function CitizenDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationsAPI.list({ status: statusFilter, per_page: 50 });
      setApplications(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    released: applications.filter(a => a.status === 'released').length,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>My Applications</h1>
          <p className="page-header-subtitle">Track and manage your assistance requests</p>
        </div>
        <Link to="/citizen/apply" className="btn btn-primary" id="apply-btn">
          ➕ New Application
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'Total', count: statusCounts.all, color: 'blue', icon: '📋' },
          { label: 'Pending', count: statusCounts.pending, color: 'gold', icon: '⏳' },
          { label: 'Approved', count: statusCounts.approved, color: 'green', icon: '✅' },
          { label: 'Released', count: statusCounts.released, color: 'purple', icon: '📦' },
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
        {['all', 'pending', 'under_review', 'approved', 'released', 'rejected'].map(status => (
          <button
            key={status}
            className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : getStatusConfig(status).label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : applications.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Applications Found</h3>
            <p>You haven't submitted any assistance applications yet. Click the button above to get started!</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Queue #</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => {
                  const statusConf = getStatusConfig(app.status);
                  const priorityConf = getPriorityConfig(app.priority_level);
                  return (
                    <tr key={app.id}>
                      <td>
                        <code style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary-500)' }}>
                          {app.reference_id}
                        </code>
                      </td>
                      <td>{app.assistance_type?.name || '—'}</td>
                      <td>
                        <span className={`badge badge-dot badge-${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${priorityConf.color}`}>
                          {priorityConf.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {app.queue_position || '—'}
                      </td>
                      <td>{formatDate(app.created_at)}</td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                        >
                          {selectedApp?.id === app.id ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="modal-backdrop" onClick={() => setSelectedApp(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3>Application Details</h3>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {selectedApp.reference_id}
                </p>
              </div>
              <button className="modal-close" onClick={() => setSelectedApp(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`badge badge-dot badge-${getStatusConfig(selectedApp.status).color}`}>
                    {getStatusConfig(selectedApp.status).label}
                  </span>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <span className={`badge badge-${getPriorityConfig(selectedApp.priority_level).color}`}>
                    {getPriorityConfig(selectedApp.priority_level).label}
                  </span>
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <p style={{ fontSize: 'var(--font-size-sm)' }}>{selectedApp.assistance_type?.name}</p>
                </div>
                <div>
                  <label className="form-label">Queue Position</label>
                  <p style={{ fontSize: 'var(--font-size-sm)' }}>{selectedApp.queue_position || 'Not in queue'}</p>
                </div>
              </div>
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <label className="form-label">Purpose</label>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{selectedApp.purpose}</p>
              </div>
              {selectedApp.admin_remarks && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <label className="form-label">Admin Remarks</label>
                  <p style={{
                    fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)',
                    padding: 'var(--space-md)', background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    {selectedApp.admin_remarks}
                  </p>
                </div>
              )}
              <div>
                <label className="form-label">Submitted</label>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>{formatDate(selectedApp.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
