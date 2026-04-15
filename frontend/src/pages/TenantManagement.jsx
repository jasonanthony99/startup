import { useState, useEffect } from 'react';
import { tenantsAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import { provinces, getCitiesByProvince, getBarangaysByCity } from '../utils/philippineLocations';

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'add'
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', province: '', city: '', code: '', address: '', contact_number: '',
    email: '', admin_name: '', admin_email: '', admin_password: '',
  });

  // Subscription Modal State
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedSubTenant, setSelectedSubTenant] = useState(null);
  const [subHistory, setSubHistory] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => { fetchTenants(); }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await tenantsAPI.list();
      setTenants(res.data.tenants);
    } catch (err) {
      toast.error('Failed to load barangays.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await tenantsAPI.create(form);
      toast.success('Barangay and Admin account created successfully!');
      setView('list');
      setForm({ name: '', province: '', city: '', code: '', address: '', contact_number: '', email: '', admin_name: '', admin_email: '', admin_password: '' });
      fetchTenants();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create barangay.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (tenant) => {
    try {
      await tenantsAPI.update(tenant.id, { is_active: !tenant.is_active });
      toast.success(`Barangay ${tenant.is_active ? 'deactivated' : 'activated'} successfully.`);
      fetchTenants();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const openSubscriptionView = async (tenant) => {
    setSelectedSubTenant(tenant);
    setView('manage_subscription');
    setSubLoading(true);
    try {
      const res = await tenantsAPI.getSubscriptionHistory(tenant.id);
      setSubHistory(res.data.history);
    } catch(err) {
      toast.error('Failed to load subscription history');
    } finally {
      setSubLoading(false);
    }
  };

  const adjustSubscription = async (plan, daysToAdd) => {
    if (!selectedSubTenant) return;
    try {
      let payload = { subscription_plan: plan };
      if (daysToAdd !== null) {
        const currentDate = selectedSubTenant.subscription_expires_at ? new Date(selectedSubTenant.subscription_expires_at) : new Date();
        const newDate = new Date();
        // If they still have time left, add on top of it. If it's expired, start from today.
        if (currentDate > new Date()) {
          newDate.setTime(currentDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        } else {
          newDate.setTime(new Date().getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
        }
        // Format to YYYY-MM-DD HH:mm:ss for MySQL
        payload.subscription_expires_at = newDate.toISOString().slice(0, 19).replace('T', ' ');
      } else {
        payload.subscription_expires_at = null; // Free plan
      }

      await tenantsAPI.update(selectedSubTenant.id, payload);
      toast.success(`Subscription adjusted to ${plan}`);
      setView('list');
      fetchTenants();
    } catch (err) {
      toast.error('Failed to adjust subscription');
    }
  };

  if (loading && view === 'list') return <div className="loader"><div className="loader-spinner" /></div>;

  const statusColors = {
    active: { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' },
    inactive: { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' },
  };

  return (
    <div className="animate-fade-in">
      {view === 'list' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px' }}>
                <span style={{ fontSize: '1.5rem' }}>🏢</span> Barangay Management
              </h1>
              <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '0.9rem' }}>
                Register and manage barangays on the platform
              </p>
            </div>
            <button
              onClick={() => setView('add')}
              style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                color: 'white', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(13,71,161,0.25)',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>+</span> New Barangay
            </button>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    {['Barangay', 'Code', 'Citizens', 'Applications', 'Status', 'Plan', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{
                        padding: '14px 20px', textAlign: 'left', fontSize: '0.78rem',
                        fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase',
                        letterSpacing: '0.05em', background: 'var(--bg-secondary)'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.length === 0 ? (
                    <tr><td colSpan="8" style={{ padding: '60px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏛️</div>
                      <p style={{ fontWeight: '500', color: 'var(--text-secondary)', margin: '0 0 4px' }}>No barangays registered</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>Click "New Barangay" to get started</p>
                    </td></tr>
                  ) : (
                    tenants.map(tenant => {
                      const st = tenant.is_active ? statusColors.active : statusColors.inactive;
                      
                      // Calculate expiration warnings
                      let isExpiringSoon = false;
                      let isExpired = false;
                      let daysRemaining = 0;
                      if (tenant.subscription_plan && tenant.subscription_plan !== 'free' && tenant.subscription_expires_at) {
                        const expiry = new Date(tenant.subscription_expires_at);
                        const today = new Date();
                        const diffTime = expiry - today;
                        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        isExpired = daysRemaining <= 0;
                        isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
                      }

                      return (
                        <tr key={tenant.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0
                              }}>🏛</div>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{tenant.name}</div>
                                {tenant.city && <div style={{ fontSize: '0.8rem', color: 'var(--primary-600)', fontWeight: '500' }}>{tenant.city}{tenant.province ? `, ${tenant.province}` : ''}</div>}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{tenant.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <code style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '2px 8px', borderRadius: '4px' }}>{tenant.code}</code>
                          </td>
                          <td style={{ padding: '14px 20px', fontWeight: '500' }}>{tenant.users_count}</td>
                          <td style={{ padding: '14px 20px', fontWeight: '500' }}>{tenant.applications_count}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                              background: st.bg, color: st.text
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.dot }}></span>
                              {tenant.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', cursor: 'pointer' }} onClick={() => openSubscriptionView(tenant)}>
                            {tenant.subscription_plan === 'free' || !tenant.subscription_plan ? (
                              <span className="badge badge-neutral" style={{ borderRadius: '4px' }}>Free Plan</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className={`badge ${isExpired ? 'badge-rejected' : isExpiringSoon ? 'badge-pending' : 'badge-approved'}`} style={{ borderRadius: '4px', width: 'fit-content' }}>
                                  ⭐ {tenant.subscription_plan.charAt(0).toUpperCase() + tenant.subscription_plan.slice(1)}
                                </span>
                                {!isExpired && <span style={{ fontSize: '0.75rem', color: isExpiringSoon ? '#d97706' : 'var(--text-tertiary)', fontWeight: isExpiringSoon ? '600' : 'normal' }}>
                                  {isExpiringSoon ? `Expiring in ${daysRemaining} days!` : `Ends ${formatDate(tenant.subscription_expires_at)}`}
                                </span>}
                                {isExpired && <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '600' }}>
                                  Expired on {formatDate(tenant.subscription_expires_at)}
                                </span>}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{formatDate(tenant.created_at)}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => toggleStatus(tenant)}
                                style={{
                                  padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '500',
                                  border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.15s',
                                  background: tenant.is_active ? 'white' : 'var(--primary-50)',
                                  color: tenant.is_active ? 'var(--text-secondary)' : 'var(--primary-700)',
                                }}
                              >
                                {tenant.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {tenants.length > 0 && (
              <div style={{
                padding: '12px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                fontSize: '0.85rem', color: 'var(--text-tertiary)'
              }}>
                {tenants.length} barangay{tenants.length !== 1 ? 's' : ''} registered
              </div>
            )}
          </div>
        </>
      )}
      
      {view === 'add' && (
        /* ─── Add Barangay View ─────────────────────────────────────────── */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Breadcrumbs / Back */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <button 
              onClick={() => setView('list')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: 0,
                background: 'none', border: 'none', color: 'var(--primary-600)',
                fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '12px'
              }}
            >
              ← Back to Barangay Directory
            </button>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
              }}>🏛</div>
              Register New Barangay
            </h1>
            <p style={{ color: 'var(--text-tertiary)', margin: '8px 0 0', fontSize: '1rem' }}>
              Create a new entity on the system and assign its primary administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card" style={{ padding: '32px' }}>
              {/* Section: Barangay Info */}
              <div style={{
                fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-tertiary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <span style={{ color: 'var(--primary-500)' }}>01</span>
                Barangay Information
                <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                <div>
                  <label style={labelStyle}>Province <span style={{ color: '#ef4444' }}>*</span></label>
                  <select required value={form.province} onChange={e => setForm({...form, province: e.target.value, city: '', name: ''})} style={inputStyle}>
                    <option value="" disabled>Select Province</option>
                    {provinces.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>City / Municipality <span style={{ color: '#ef4444' }}>*</span></label>
                  <select required disabled={!form.province} value={form.city} onChange={e => setForm({...form, city: e.target.value, name: ''})} style={{...inputStyle, background: !form.province ? 'var(--bg-secondary)' : 'white'}}>
                    <option value="" disabled>Select City</option>
                    {getCitiesByProvince(form.province).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Official Barangay Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <select required disabled={!form.city} value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{...inputStyle, background: !form.city ? 'var(--bg-secondary)' : 'white'}}>
                    <option value="" disabled>Select Barangay</option>
                    {getBarangaysByCity(form.province, form.city).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>System Code (Short Identifier) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" required placeholder="e.g. SAN-JOSE" value={form.code}
                    onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} style={inputStyle}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                    Used for technical IDs and unique URLs.
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Official Email Address</label>
                  <input type="email" placeholder="brgy@gov.ph" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})} style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Physical Office Address</label>
                  <textarea placeholder="Complete address of the Barangay Hall" value={form.address}
                    onChange={e => setForm({...form, address: e.target.value})} 
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Official Contact Number</label>
                  <input type="text" placeholder="(02) 8XXX-XXXX" value={form.contact_number}
                    onChange={e => setForm({...form, contact_number: e.target.value})} style={inputStyle}
                  />
                </div>
              </div>

              {/* Section: Admin Account */}
              <div style={{
                fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--text-tertiary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <span style={{ color: 'var(--primary-500)' }}>02</span>
                Administrator Account
                <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></span>
              </div>

              <div style={{
                padding: '20px', borderRadius: '12px', background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: '24px',
                display: 'flex', gap: '16px', alignItems: 'flex-start'
              }}>
                <div style={{ fontSize: '1.5rem' }}>🛡️</div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e', lineHeight: '1.6' }}>
                  <strong>Security Note:</strong> This will create the primary administrator for this barangay.
                  This user will have full access to resident data and application management within their jurisdiction.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Admin Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" required placeholder="Juan Dela Cruz" value={form.admin_name}
                    onChange={e => setForm({...form, admin_name: e.target.value})} style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Admin Login Email <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="email" required placeholder="admin@email.com" value={form.admin_email}
                    onChange={e => setForm({...form, admin_email: e.target.value})} style={inputStyle}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Initial Login Password <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="password" required minLength="8" placeholder="Create a secure password" value={form.admin_password}
                    onChange={e => setForm({...form, admin_password: e.target.value})} style={inputStyle}
                  />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
                    Password must be at least 8 characters. The admin can secure their account later.
                  </p>
                </div>
              </div>

              <div style={{
                marginTop: '40px', paddingTop: '30px', borderTop: '1px solid var(--border-color)',
                display: 'flex', justifyContent: 'flex-end', gap: '12px'
              }}>
                <button type="button" onClick={() => setView('list')} style={{
                  padding: '12px 24px', borderRadius: '10px', border: '1px solid var(--border-color)',
                  background: 'white', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{
                  padding: '12px 32px', borderRadius: '10px', border: 'none',
                  background: submitting ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                  color: submitting ? 'var(--text-tertiary)' : 'white', fontWeight: '600', fontSize: '0.9rem',
                  cursor: submitting ? 'default' : 'pointer', boxShadow: submitting ? 'none' : '0 4px 12px rgba(13,71,161,0.2)'
                }}>
                  {submitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {view === 'manage_subscription' && selectedSubTenant && (
        /* ─── Manage Subscription View ──────────────────────────────────── */
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Breadcrumbs / Back */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <button 
              onClick={() => setView('list')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: 0,
                background: 'none', border: 'none', color: 'var(--primary-600)',
                fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '12px'
              }}
            >
              <span>←</span> Back to Directory
            </button>
            <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>⭐</span> Manage Subscription: {selectedSubTenant.name}
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
              Update subscription plans, extend expiration dates, and view payment history.
            </p>
          </div>

          <div className="card">
            {/* Current Status Banner */}
            <div style={{
              background: selectedSubTenant.subscription_plan && selectedSubTenant.subscription_plan !== 'free' ? 'var(--primary-50)' : 'var(--bg-secondary)',
              border: `1px solid ${selectedSubTenant.subscription_plan && selectedSubTenant.subscription_plan !== 'free' ? 'var(--primary-200)' : 'var(--border-color)'}`,
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-xl)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Current Plan</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedSubTenant.subscription_plan ? selectedSubTenant.subscription_plan.toUpperCase() : 'FREE'}
                </div>
              </div>
              {selectedSubTenant.subscription_expires_at && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Expires At</div>
                  <div style={{ fontWeight: 600 }}>{formatDate(selectedSubTenant.subscription_expires_at)}</div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <h4 style={{ marginBottom: '16px' }}>Manual Adjustments</h4>
            <div style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => adjustSubscription('free', null)}>
                Revoke / Set to Free
              </button>
              <button className="btn" style={{ background: '#0284c7', color: 'white' }} onClick={() => adjustSubscription('monthly', 30)}>
                + Grant 30 Days
              </button>
              <button className="btn" style={{ background: '#0369a1', color: 'white' }} onClick={() => adjustSubscription('yearly', 365)}>
                + Grant 1 Year
              </button>
            </div>

            {/* Payment History */}
            <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💳</span> Payment History
            </h4>
            {subLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading history...</div>
            ) : (
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Plan</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Method</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Ref ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subHistory.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No payment history found over the system.</td></tr>
                    ) : (
                      subHistory.map((pmt) => (
                        <tr key={pmt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 16px' }}>{new Date(pmt.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{pmt.plan}</td>
                          <td style={{ padding: '12px 16px' }}>₱{parseFloat(pmt.amount).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{pmt.payment_method}</td>
                          <td style={{ padding: '12px 16px' }}><code style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px' }}>{pmt.reference_id}</code></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)',
  marginBottom: '8px'
};

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none',
  transition: 'all 0.15s', background: 'white', boxSizing: 'border-box'
};
