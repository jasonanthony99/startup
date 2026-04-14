import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { getMonthName } from '../utils/helpers';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
  });

  useEffect(() => {
    fetchMonthlySummary();
  }, [year]);

  const fetchMonthlySummary = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.monthlySummary(year);
      setMonthlyData(res.data);
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const res = await adminAPI.reports(filters);
      setReportData(res.data);
      toast.success(`Report generated: ${res.data.applications?.length || 0} records found.`);
    } catch {
      toast.error('Failed to generate report.');
    }
  };

  if (loading) return <div className="loader"><div className="loader-spinner" /></div>;

  const monthly = monthlyData?.monthly_data || [];

  const monthlyChartData = {
    labels: monthly.map(m => getMonthName(m.month)),
    datasets: [
      {
        label: 'Total',
        data: monthly.map(m => m.total),
        borderColor: 'rgba(13, 71, 161, 1)',
        backgroundColor: 'rgba(13, 71, 161, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Approved',
        data: monthly.map(m => m.approved),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Released',
        data: monthly.map(m => m.released),
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: 'Rejected',
        data: monthly.map(m => m.rejected),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const barChartData = {
    labels: monthly.map(m => getMonthName(m.month)),
    datasets: [
      {
        label: 'Approved',
        data: monthly.map(m => m.approved),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Released',
        data: monthly.map(m => m.released),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Rejected',
        data: monthly.map(m => m.rejected),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
      },
      {
        label: 'Pending',
        data: monthly.map(m => m.pending),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderRadius: 6,
      },
    ],
  };

  // Annual summary
  const annualTotal = monthly.reduce((a, m) => a + m.total, 0);
  const annualApproved = monthly.reduce((a, m) => a + m.approved, 0);
  const annualReleased = monthly.reduce((a, m) => a + m.released, 0);
  const annualRejected = monthly.reduce((a, m) => a + m.rejected, 0);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="page-header-subtitle">Comprehensive data analysis and report generation</p>
        </div>
        <div className="page-header-actions">
          <select className="form-select" value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ width: 'auto' }}>
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Annual Summary Cards */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="stats-card blue">
          <div className="stats-card-icon">📋</div>
          <div className="stats-card-info">
            <h3>{annualTotal}</h3>
            <p>Total ({year})</p>
          </div>
        </div>
        <div className="stats-card green">
          <div className="stats-card-icon">✅</div>
          <div className="stats-card-info">
            <h3>{annualApproved}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stats-card purple">
          <div className="stats-card-icon">📦</div>
          <div className="stats-card-info">
            <h3>{annualReleased}</h3>
            <p>Released</p>
          </div>
        </div>
        <div className="stats-card red">
          <div className="stats-card-icon">❌</div>
          <div className="stats-card-info">
            <h3>{annualRejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Trend ({year})</div>
          </div>
          <div className="chart-container">
            <Line data={monthlyChartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Status Breakdown ({year})</div>
          </div>
          <div className="chart-container">
            <Bar data={barChartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
              scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
              },
            }} />
          </div>
        </div>
      </div>

      {/* Report Generator */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Generate Custom Report</div>
        </div>
        <div className="filter-bar">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Start Date</label>
            <input type="date" className="form-input" style={{ width: '160px' }}
              value={filters.start_date} onChange={e => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>End Date</label>
            <input type="date" className="form-input" style={{ width: '160px' }}
              value={filters.end_date} onChange={e => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Status</label>
            <select className="form-select" style={{ width: '160px' }}
              value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchReport} style={{ alignSelf: 'flex-end' }}>
            📊 Generate Report
          </button>
        </div>

        {/* Report Results */}
        {reportData && (
          <div style={{ marginTop: 'var(--space-xl)' }}>
            <div className="grid grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>{reportData.summary?.total || 0}</p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Records Found</p>
              </div>
              <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--accent-green)' }}>
                  {reportData.summary?.by_status?.approved || 0}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Approved in Range</p>
              </div>
              <div style={{ padding: 'var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--accent-red)' }}>
                  {reportData.summary?.by_status?.rejected || 0}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Rejected in Range</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
