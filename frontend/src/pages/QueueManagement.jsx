import { useState, useEffect } from 'react';
import { queueAPI, applicationsAPI } from '../services/api';
import { getStatusConfig, getPriorityConfig } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function QueueManagement() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await queueAPI.list({ status: statusFilter });
      setQueue(res.data.queue || []);
    } catch {
      toast.error('Failed to load queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleResort = async () => {
    try {
      await queueAPI.resort();
      toast.success('Queue re-sorted by priority!');
      fetchQueue();
    } catch {
      toast.error('Failed to resort queue.');
    }
  };

  const handleRelease = async (app) => {
    setReleasing(app.id);
    try {
      await applicationsAPI.updateStatus(app.id, {
        status: 'released',
        remarks: 'Assistance released to applicant.',
      });
      toast.success(`Released: ${app.reference_id}`);
      fetchQueue();
    } catch {
      toast.error('Failed to release.');
    } finally {
      setReleasing(null);
    }
  };

  const handleMoveUp = async (app, index) => {
    if (index === 0) return;
    try {
      await queueAPI.updatePosition(app.id, app.queue_position - 1);
      fetchQueue();
    } catch {
      toast.error('Failed to move.');
    }
  };

  const handleMoveDown = async (app, index) => {
    if (index === queue.length - 1) return;
    try {
      await queueAPI.updatePosition(app.id, app.queue_position + 1);
      fetchQueue();
    } catch {
      toast.error('Failed to move.');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Queue Management</h1>
          <p className="page-header-subtitle">Manage the assistance distribution queue</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleResort}>
            🔄 Re-sort by Priority
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stats-card blue">
          <div className="stats-card-icon">📑</div>
          <div className="stats-card-info">
            <h3>{queue.length}</h3>
            <p>In Queue</p>
          </div>
        </div>
        <div className="stats-card green">
          <div className="stats-card-icon">✅</div>
          <div className="stats-card-info">
            <h3>{queue.filter(q => q.status === 'approved').length}</h3>
            <p>Ready to Release</p>
          </div>
        </div>
        <div className="stats-card gold">
          <div className="stats-card-icon">🔍</div>
          <div className="stats-card-info">
            <h3>{queue.filter(q => q.status === 'under_review').length}</h3>
            <p>Under Review</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        {['all', 'approved', 'under_review'].map(status => (
          <button key={status} className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setStatusFilter(status)}>
            {status === 'all' ? 'All' : getStatusConfig(status).label}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="loader"><div className="loader-spinner" /></div>
      ) : queue.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>Queue is Empty</h3>
            <p>No applications are currently in the queue.</p>
          </div>
        </div>
      ) : (
        <div>
          {queue.map((app, index) => (
            <div key={app.id} className="queue-item animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="queue-position">{app.queue_position}</div>
              <div className="queue-item-info">
                <div className="queue-item-name">{app.user?.name}</div>
                <div className="queue-item-ref">{app.reference_id}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block' }}>Type</span>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{app.assistance_type?.name}</span>
              </div>
              <div>
                <span className={`badge badge-dot badge-${getStatusConfig(app.status).color}`}>
                  {getStatusConfig(app.status).label}
                </span>
              </div>
              <div>
                <span className={`badge badge-${getPriorityConfig(app.priority_level).color}`}>
                  {getPriorityConfig(app.priority_level).label}
                </span>
              </div>
              <div className="queue-item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => handleMoveUp(app, index)}
                  disabled={index === 0} title="Move Up">▲</button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleMoveDown(app, index)}
                  disabled={index === queue.length - 1} title="Move Down">▼</button>
                {app.status === 'approved' && (
                  <button className="btn btn-success btn-sm"
                    onClick={() => handleRelease(app)}
                    disabled={releasing === app.id}>
                    {releasing === app.id ? '...' : '📦 Release'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
