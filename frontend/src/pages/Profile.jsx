import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { getInitials, maskEmail } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth || '',
    is_senior_citizen: user?.is_senior_citizen || false,
    is_pwd: user?.is_pwd || false,
    is_low_income: user?.is_low_income || false,
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleProfileChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === 'profile_photo') {
      const file = files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      return;
    }
    setProfileForm({
      ...profileForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...profileForm };
      if (photo) {
        data.profile_photo = photo;
      }
      const res = await authAPI.updateProfile(data);
      updateUser({ ...res.data.user });
      toast.success('Profile updated successfully!');
      setPhoto(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.password_confirmation) {
      return toast.error('Passwords do not match.');
    }

    setLoading(true);
    try {
      await authAPI.changePassword(passwordForm);
      toast.success('Password updated successfully!');
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p className="page-header-subtitle">Manage your personal information and account security</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 'var(--space-2xl)', alignItems: 'start' }}>
        {/* Left Column: Personal info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--space-lg)' }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                overflow: 'hidden', 
                border: '4px solid var(--bg-tertiary)',
                boxShadow: 'var(--shadow-md)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                color: 'var(--primary-600)',
                fontWeight: 'bold'
              }}>
                {photoPreview || user?.profile_photo_url ? (
                  <img 
                    src={photoPreview || user?.profile_photo_url} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{getInitials(user?.name)}</span>
                )}
              </div>
              <label 
                className="btn btn-ghost btn-sm" 
                style={{ 
                  position: 'absolute', 
                  bottom: '0', 
                  right: '0', 
                  borderRadius: '50%', 
                  width: '36px', 
                  height: '36px', 
                  padding: '8px',
                  background: 'var(--primary-600)',
                  color: 'white',
                  cursor: 'pointer',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
                title="Change Photo"
              >
                📷
                <input 
                  type="file" 
                  name="profile_photo" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleProfileChange}
                />
              </label>
            </div>
            <h2 style={{ marginBottom: 'var(--space-xs)' }}>{user?.name}</h2>
            <p className="form-hint" style={{ color: 'var(--primary-600)', fontWeight: '500' }}>
              {user?.role?.replace('_', ' ').toUpperCase()}
            </p>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              {user?.role === 'citizen' ? '👤 Personal Information' : '💼 Official Credentials'}
            </h3>
            <form onSubmit={updateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="form-input"
                  value={maskEmail(user?.email)}
                  disabled
                  style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-input"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="e.g. 09123456789"
                  />
                </div>
                {user?.role === 'citizen' && (
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      className="form-input"
                      value={profileForm.date_of_birth}
                      onChange={handleProfileChange}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea
                  name="address"
                  className="form-textarea"
                  value={profileForm.address}
                  onChange={handleProfileChange}
                  placeholder={user?.role === 'citizen' ? "Street, Room/Unit, Building, Subdivision" : "Office/Department or Residential Address"}
                />
              </div>

              {user?.role === 'citizen' && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                  <label className="form-label">Household Status</label>
                  <p className="form-hint" style={{ marginBottom: 'var(--space-md)' }}>
                    These help us calculate your priority for assistance programs.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <label className="form-checkbox">
                      <input
                        type="checkbox"
                        name="is_senior_citizen"
                        checked={profileForm.is_senior_citizen}
                        onChange={handleProfileChange}
                      />
                      Senior Citizen
                    </label>
                    <label className="form-checkbox">
                      <input
                        type="checkbox"
                        name="is_pwd"
                        checked={profileForm.is_pwd}
                        onChange={handleProfileChange}
                      />
                      Person with Disability (PWD)
                    </label>
                    <label className="form-checkbox">
                      <input
                        type="checkbox"
                        name="is_low_income"
                        checked={profileForm.is_low_income}
                        onChange={handleProfileChange}
                      />
                      Low Income / Indigent Household
                    </label>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              🔒 Account Security
            </h3>
            <p className="form-hint" style={{ marginBottom: 'var(--space-lg)' }}>
              Change your password regularly to keep your account secure.
            </p>
            
            <form onSubmit={updatePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  className="form-input"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-lg)', marginTop: 'var(--space-xl)' }}>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={passwordForm.password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  name="password_confirmation"
                  className="form-input"
                  value={passwordForm.password_confirmation}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', borderColor: 'var(--primary-500)', color: 'var(--primary-600)' }} disabled={loading}>
                {loading ? 'Updating...' : '🔄 Update Password'}
              </button>
            </form>
          </div>

          {user?.role === 'citizen' && (
            <div className="card" style={{ background: 'var(--primary-50)', border: '1px dashed var(--primary-200)' }}>
              <h4 style={{ color: 'var(--primary-700)', marginBottom: 'var(--space-sm)' }}>🏛️ Barangay Member</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Your account is registered with <strong>{user?.tenant?.name}</strong>. 
                Changing your barangay affiliation requires contacting the system administrator.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
