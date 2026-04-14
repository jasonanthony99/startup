import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { transparencyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    tenant_code: '',
    phone: '',
    address: '',
    date_of_birth: '',
    is_senior_citizen: false,
    is_pwd: false,
    is_low_income: false,
  });

  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const res = await transparencyAPI.barangayList();
        setBarangays(res.data.barangays || []);
      } catch {
        // will use manual input
      }
    };
    fetchBarangays();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const user = await register(form);
      toast.success('Registration successful! Welcome to BAQTS.');
      navigate('/citizen');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      const errors = err.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0]?.[0];
        setError(firstError || message);
      } else {
        setError(message);
      }
      toast.error('Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-left">
        <div className="auth-left-logo">🏛</div>
        <h1>Join BAQTS</h1>
        <p>Create your citizen account and start applying for barangay assistance programs.</p>
      </div>

      <div className="auth-right">
        <div className="auth-form-container" style={{ maxWidth: '500px' }}>
          <h2>Create Account</h2>
          <p className="subtitle">Register as a citizen to apply for assistance</p>

          {error && (
            <div style={{
              padding: 'var(--space-md)', background: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-barangay">Barangay</label>
              <select
                id="reg-barangay"
                name="tenant_code"
                className="form-select"
                value={form.tenant_code}
                onChange={handleChange}
                required
              >
                <option value="">Select your barangay</option>
                {barangays.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <input id="reg-name" type="text" name="name" className="form-input"
                  placeholder="Juan Dela Cruz" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email</label>
                <input id="reg-email" type="email" name="email" className="form-input"
                  placeholder="you@email.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <input id="reg-password" type="password" name="password" className="form-input"
                  placeholder="Min. 8 characters" value={form.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                <input id="reg-confirm" type="password" name="password_confirmation" className="form-input"
                  placeholder="Confirm password" value={form.password_confirmation} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">Phone</label>
                <input id="reg-phone" type="text" name="phone" className="form-input"
                  placeholder="09171234567" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-dob">Date of Birth</label>
                <input id="reg-dob" type="date" name="date_of_birth" className="form-input"
                  value={form.date_of_birth} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-address">Address</label>
              <input id="reg-address" type="text" name="address" className="form-input"
                placeholder="Street, Barangay, City" value={form.address} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Status / Classification</label>
              <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', marginTop: '4px' }}>
                <label className="form-checkbox">
                  <input type="checkbox" name="is_senior_citizen"
                    checked={form.is_senior_citizen} onChange={handleChange} />
                  Senior Citizen (60+)
                </label>
                <label className="form-checkbox">
                  <input type="checkbox" name="is_pwd"
                    checked={form.is_pwd} onChange={handleChange} />
                  PWD
                </label>
                <label className="form-checkbox">
                  <input type="checkbox" name="is_low_income"
                    checked={form.is_low_income} onChange={handleChange} />
                  Low Income
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-sm)' }}
              disabled={loading} id="register-submit">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{
            textAlign: 'center', marginTop: 'var(--space-xl)',
            fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)'
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
