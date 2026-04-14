import { useState, useEffect } from 'react';
import { adminAPI, applicationsAPI } from '../services/api';
import { formatDate, getStatusConfig, getPriorityConfig } from '../utils/helpers';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await adminAPI.dashboard();
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return;
    setUpdating(true);
    try {
      await applicationsAPI.updateStatus(statusModal.id, statusForm);
      toast.success('Status updated successfully!');
      setStatusModal(null);
      setStatusForm({ status: '', remarks: '' });
      fetchDashboard();
    } catch (err) {
      toast.error('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loader"><div className="loader-spinner" /></div>;
  if (!data) return null;

  const { stats, recent_applications, monthly_trend, by_type } = data;

  // Monthly chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyChartData = {
    labels: monthly_trend?.map(m => months[m.month - 1]) || [],
    datasets: [
      {
        label: 'Total',
        data: monthly_trend?.map(m => m.total) || [],
        backgroundColor: 'rgba(13, 71, 161, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Approved',
        data: monthly_trend?.map(m => m.approved_count) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  // Type distribution chart
  const typeChartData = {
    labels: by_type?.map(t => t.name) || [],
    datasets: [{
      data: by_type?.map(t => t.count) || [],
      backgroundColor: [
        'rgba(13, 71, 161, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(252, 209, 22, 0.8)',
        'rgba(206, 17, 39, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(245, 158, 11, 0.8)',
      ],
      borderWidth: 0,
    }],
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-header-subtitle">Overview of assistance applications and queue status</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { label: 'Total Applications', count: stats.total_applications, color: 'blue', icon: '📋' },
          { label: 'Pending Review', count: stats.pending + stats.under_review, color: 'gold', icon: '⏳' },
          { label: 'Approved', count: stats.approved, color: 'green', icon: '✅' },
          { label: 'Released', count: stats.released, color: 'purple', icon: '📦' },
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

      {/* Charts */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Trend</div>
          </div>
          <div className="chart-container">
            <Bar data={monthlyChartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">By Assistance Type</div>
          </div>
          <div className="chart-container" style={{ display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={typeChartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } } },
              cutout: '60%',
            }} />
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-xl) var(--space-xl) 0' }}>
          <h3 style={{ fontSize: 'var(--font-size-lg)' }}>Recent Applications</h3>
        </div>
        <div className="data-table-wrapper" style={{ marginTop: 'var(--space-md)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Applicant</th>
                <th>Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(recent_applications || []).map(app => (
                <tr key={app.id}>
                  <td><code style={{ fontSize: '11px', color: 'var(--primary-500)' }}>{app.reference_id}</code></td>
                  <td>{app.user?.name || '—'}</td>
                  <td>{app.assistance_type?.name || '—'}</td>
                  <td>
                    <span className={`badge badge-dot badge-${getStatusConfig(app.status).color}`}>
                      {getStatusConfig(app.status).label}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${getPriorityConfig(app.priority_level).color}`}>
                      {getPriorityConfig(app.priority_level).label}
                    </span>
                  </td>
                  <td>{formatDate(app.created_at)}</td>
                  <td>
                    {app.status !== 'released' && app.status !== 'rejected' && (
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setStatusModal(app);
                        setStatusForm({ status: '', remarks: '' });
                      }}>
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Update Modal */}
      {statusModal && (
        <div className="modal-backdrop" onClick={() => setStatusModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Status</h3>
              <button className="modal-close" onClick={() => setStatusModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                {statusModal.reference_id} — {statusModal.user?.name}
              </p>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-select" value={statusForm.status}
                  onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}>
                  <option value="">Select status</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="released">Released</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea className="form-textarea" placeholder="Add remarks..."
                  value={statusForm.remarks}
                  onChange={e => setStatusForm({ ...statusForm, remarks: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setStatusModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating || !statusForm.status}>
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
