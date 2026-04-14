import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      
      // Navigate based on role
      if (user.role === 'citizen') {
        navigate('/citizen');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left-logo">🏛</div>
        <h1>Welcome Back</h1>
        <p>Sign in to access your barangay assistance portal and manage your applications.</p>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h2>Sign In</h2>
          <p className="subtitle">Enter your credentials to continue</p>

          {error && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-lg)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-sm)' }}
              disabled={loading}
              id="login-submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: 'var(--space-xl)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)'
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>Register here</Link>
          </p>

          <div style={{
            marginTop: 'var(--space-xl)',
            padding: 'var(--space-md)',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)',
          }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Demo Accounts:</strong>
            <div style={{ marginTop: '4px' }}>
              Super Admin: superadmin@barangay.gov.ph<br />
              Brgy Admin: admin@sanisidro.gov.ph<br />
              Citizen: maria.santos@email.com<br />
              Password: password123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
