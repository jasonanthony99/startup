import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transparencyAPI } from '../services/api';
import { getMonthName, formatDate, getStatusConfig } from '../utils/helpers';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function TransparencyDashboard() {
  const { code } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [barangays, setBarangays] = useState([]);
  const [selectedCode, setSelectedCode] = useState(code || '');
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [released, setReleased] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const res = await transparencyAPI.barangayList();
        setBarangays(res.data.barangays || []);
        if (!selectedCode && res.data.barangays?.length > 0) {
          setSelectedCode(res.data.barangays[0].code);
        }
      } catch { /* silently fail */ }
    };
    fetchBarangays();
  }, []);

  useEffect(() => {
    if (selectedCode) {
      fetchData();
    }
  }, [selectedCode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, monthlyRes, releasedRes] = await Promise.all([
        transparencyAPI.stats(selectedCode),
        transparencyAPI.monthly(selectedCode),
        transparencyAPI.released(selectedCode, { per_page: 10 }),
      ]);
      setStats(statsRes.data);
      setMonthly(monthlyRes.data);
      setReleased(releasedRes.data.data || []);
    } catch { /* silently fail */ }
    setLoading(false);
  };

  const monthlyData = monthly?.monthly_data || [];

  const monthlyChartData = {
    labels: monthlyData.map(m => `${getMonthName(m.month)} ${m.year}`),
    datasets: [
      {
        label: 'Total',
        data: monthlyData.map(m => m.total),
        backgroundColor: 'rgba(13, 71, 161, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Approved',
        data: monthlyData.map(m => m.approved_count),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Released',
        data: monthlyData.map(m => m.released_count),
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  const typeChartData = stats ? {
    labels: stats.by_type?.map(t => t.name) || [],
    datasets: [{
      data: stats.by_type?.map(t => t.count) || [],
      backgroundColor: [
        'rgba(13, 71, 161, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(252, 209, 22, 0.8)',
        'rgba(206, 17, 39, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(245, 158, 11, 0.8)',
      ],
      borderWidth: 0,
    }],
  } : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="transparency-header">
        <Link 
          to={isAuthenticated ? (user?.role === 'citizen' ? '/citizen' : '/admin') : '/'} 
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--font-size-sm)', display: 'inline-block', marginBottom: 'var(--space-md)' }}
        >
          ← Back to Home
        </Link>
        <h1>🏛️ Transparency Dashboard</h1>
        <p>Public view of barangay assistance data — promoting accountability and trust</p>

        {/* Barangay Selector */}
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <select
            className="form-select"
            style={{
              maxWidth: '320px', margin: '0 auto', background: 'rgba(255,255,255,0.15)',
              color: 'white', border: '1px solid rgba(255,255,255,0.3)',
              textAlign: 'center', fontSize: 'var(--font-size-base)',
            }}
            value={selectedCode}
            onChange={e => setSelectedCode(e.target.value)}
            id="barangay-selector"
          >
            <option value="" style={{ color: 'black' }}>Select Barangay</option>
            {barangays.map(b => (
              <option key={b.code} value={b.code} style={{ color: 'black' }}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-xl)' }}>
        {loading ? (
          <div className="loader"><div className="loader-spinner" /></div>
        ) : !stats ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🏛️</div>
              <h3>Select a Barangay</h3>
              <p>Choose a barangay from the dropdown above to view its transparency data.</p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Barangay Info */}
            <h2 style={{ marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
              {stats.barangay?.name}
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="stats-card blue">
                <div className="stats-card-icon">📋</div>
                <div className="stats-card-info">
                  <h3>{stats.stats?.total_applications}</h3>
                  <p>Total Applications</p>
                </div>
              </div>
              <div className="stats-card green">
                <div className="stats-card-icon">✅</div>
                <div className="stats-card-info">
                  <h3>{stats.stats?.approved + stats.stats?.released}</h3>
                  <p>Approved / Released</p>
                </div>
              </div>
              <div className="stats-card red">
                <div className="stats-card-icon">❌</div>
                <div className="stats-card-info">
                  <h3>{stats.stats?.rejected}</h3>
                  <p>Rejected</p>
                </div>
              </div>
              <div className="stats-card gold">
                <div className="stats-card-icon">📊</div>
                <div className="stats-card-info">
                  <h3>{stats.stats?.approval_rate}%</h3>
                  <p>Approval Rate</p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Monthly Summary (Last 12 Months)</div>
                </div>
                <div className="chart-container">
                  <Bar data={monthlyChartData} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                  }} />
                </div>
              </div>

              {typeChartData && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">By Assistance Type</div>
                  </div>
                  <div className="chart-container" style={{ display: 'flex', justifyContent: 'center' }}>
                    <Doughnut data={typeChartData} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } } },
                      cutout: '60%',
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 'var(--space-xl) var(--space-xl) 0' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)' }}>Recent Assistance Activity</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                  Real-time public record of assistance application progress
                </p>
              </div>
              {released.length === 0 ? (
                <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No recent activity yet.
                </div>
              ) : (
                <div className="data-table-wrapper" style={{ marginTop: 'var(--space-md)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Recipient Name</th>
                        <th>Assistance Type</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {released.map(r => {
                        const status = getStatusConfig(r.status);
                        return (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 600 }}>{r.user?.name || '—'}</td>
                            <td>{r.assistance_type?.name || '—'}</td>
                            <td>
                              <span className={`badge badge-dot badge-${status.color}`}>
                                {status.label}
                              </span>
                            </td>
                            <td>{formatDate(r.updated_at || r.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="landing-footer" style={{ marginTop: 'var(--space-3xl)' }}>
        <p>
          🏛️ BAQTS Transparency Dashboard — Promoting accountability in barangay governance. 🇵🇭
        </p>
      </footer>
    </div>
  );
}
