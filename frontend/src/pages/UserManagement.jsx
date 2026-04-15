import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { maskEmail } from '../utils/helpers';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  citizen: { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' },
  barangay_admin: { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' },
  super_admin: { bg: '#fdf4ff', text: '#86198f', dot: '#a855f7' },
};

const ROLE_LABELS = {
  citizen: 'Citizen',
  barangay_admin: 'Barangay Admin',
  super_admin: 'Super Admin',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers();
      setUsers(res.data.users);
    } catch (err) { toast.error('Failed to fetch residents'); }
    finally { setLoading(false); }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success('Role updated successfully');
      setShowRoleModal(false);
      fetchUsers();
    } catch (err) { toast.error('Failed to update role'); }
  };

  const viewHistory = async (user) => {
    setSelectedUser(user);
    setHistoryLoading(true);
    setShowHistory(true);
    try {
      const res = await adminAPI.getUserApplications(user.id);
      setHistory(res.data.applications);
    } catch (err) { toast.error('Failed to fetch history'); }
    finally { setHistoryLoading(false); }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    all: users.length,
    citizen: users.filter(u => u.role === 'citizen').length,
    barangay_admin: users.filter(u => u.role === 'barangay_admin').length,
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
  const getAvatarColor = (name) => avatarColors[name?.charCodeAt(0) % avatarColors.length] || '#6366f1';

  const STATUS_MAP = {
    pending: { label: 'Pending', bg: '#fef3c7', text: '#92400e', icon: '⏳' },
    under_review: { label: 'Under Review', bg: '#dbeafe', text: '#1e40af', icon: '🔍' },
    approved: { label: 'Approved', bg: '#dcfce7', text: '#166534', icon: '✅' },
    released: { label: 'Released', bg: '#e0e7ff', text: '#3730a3', icon: '📦' },
    rejected: { label: 'Rejected', bg: '#fee2e2', text: '#991b1b', icon: '❌' },
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>👥</span> Resident Directory
          </h1>
          <p className="text-secondary">Manage residents, update roles, and review assistance history</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            color: 'white', padding: '10px 20px', borderRadius: 'var(--radius-lg)',
            fontWeight: '700', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(13,71,161,0.25)'
          }}>
            {users.length} <span style={{ fontWeight: '400', fontSize: '0.85rem', opacity: 0.9 }}>residents</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
          padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)', gap: 'var(--space-md)'
        }}>
          {/* Role Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'citizen', label: 'Citizens' },
              { key: 'barangay_admin', label: 'Admins' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                style={{
                  padding: '6px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: roleFilter === tab.key ? '600' : '400',
                  background: roleFilter === tab.key ? 'white' : 'transparent',
                  color: roleFilter === tab.key ? 'var(--primary-700)' : 'var(--text-secondary)',
                  boxShadow: roleFilter === tab.key ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label} <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>({roleCounts[tab.key]})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', borderRadius: 'var(--radius-lg)', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={thStyle}>Resident</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Joined</th>
                <th style={{ ...thStyle, textAlign: 'right', paddingRight: '24px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center' }}>
                  <div className="loader-spinner" style={{ margin: '0 auto' }} />
                  <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '0.9rem' }}>Loading residents...</p>
                </td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500' }}>No residents found</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Try adjusting your search or filter</p>
                </td></tr>
              ) : (
                filteredUsers.map((user, i) => {
                  const color = getAvatarColor(user.name);
                  const roleConfig = ROLE_COLORS[user.role] || ROLE_COLORS.citizen;
                  return (
                    <tr key={user.id} style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease',
                      cursor: 'default'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Avatar + Name */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '700', fontSize: '1rem',
                            flexShrink: 0, boxShadow: `0 2px 6px ${color}33`
                          }}>
                            {getInitial(user.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {maskEmail(user.email)}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td style={tdStyle}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                          background: roleConfig.bg, color: roleConfig.text
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: roleConfig.dot }}></span>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>

                      {/* Joined */}
                      <td style={tdStyle}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {new Date(user.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdStyle, textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => viewHistory(user)}
                            style={{
                              padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                              background: 'white', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '500',
                              color: 'var(--text-secondary)', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-300)'; e.currentTarget.style.color = 'var(--primary-600)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          >
                            📋 History
                          </button>
                          <button
                            onClick={() => { setSelectedUser(user); setShowRoleModal(true); }}
                            style={{
                              padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-200)',
                              background: 'var(--primary-50)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600',
                              color: 'var(--primary-700)', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-100)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-50)'; }}
                          >
                            ✏️ Role
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

        {/* Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div style={{
            padding: '12px 24px', borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-tertiary)'
          }}>
            <span>Showing {filteredUsers.length} of {users.length} residents</span>
          </div>
        )}
      </div>

      {/* ── History Modal ────────────────────────────────────────────── */}
      {showHistory && selectedUser && (
        <div style={overlayStyle} onClick={() => setShowHistory(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '24px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px',
                  background: `linear-gradient(135deg, ${getAvatarColor(selectedUser.name)}, ${getAvatarColor(selectedUser.name)}dd)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '700', fontSize: '1.1rem'
                }}>
                  {getInitial(selectedUser.name)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedUser.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Assistance History</p>
                </div>
              </div>
              <button onClick={() => setShowHistory(false)} style={closeBtn}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loader-spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
                  <p style={{ fontWeight: '500', color: 'var(--text-secondary)', margin: '0 0 4px' }}>No applications yet</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>This resident hasn't applied for any assistance.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {history.map((app) => {
                    const st = STATUS_MAP[app.status] || STATUS_MAP.pending;
                    return (
                      <div key={app.id} style={{
                        padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        transition: 'border-color 0.15s', background: 'white'
                      }}>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                          }}>{st.icon}</div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {app.assistance_type?.name || 'Unknown Type'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                              {app.reference_id} · {new Date(app.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem',
                          fontWeight: '600', background: st.bg, color: st.text
                        }}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Role Modal ───────────────────────────────────────────────── */}
      {showRoleModal && selectedUser && (
        <div style={overlayStyle} onClick={() => setShowRoleModal(false)}>
          <div style={{ ...modalStyle, maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '24px', borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Change Role</h3>
              <button onClick={() => setShowRoleModal(false)} style={closeBtn}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '14px', margin: '0 auto 12px',
                  background: `linear-gradient(135deg, ${getAvatarColor(selectedUser.name)}, ${getAvatarColor(selectedUser.name)}dd)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '700', fontSize: '1.3rem'
                }}>
                  {getInitial(selectedUser.name)}
                </div>
                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{selectedUser.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Currently: <strong>{ROLE_LABELS[selectedUser.role]}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { role: 'citizen', icon: '🏠', description: 'Can apply for assistance programs' },
                  { role: 'barangay_admin', icon: '🛡️', description: 'Can manage queue, residents, and reports' },
                ].map(opt => (
                  <button
                    key={opt.role}
                    onClick={() => handleUpdateRole(selectedUser.id, opt.role)}
                    disabled={selectedUser.role === opt.role}
                    style={{
                      padding: '14px 18px', borderRadius: 'var(--radius-lg)',
                      border: selectedUser.role === opt.role ? '2px solid var(--primary-400)' : '1px solid var(--border-color)',
                      background: selectedUser.role === opt.role ? 'var(--primary-50)' : 'white',
                      cursor: selectedUser.role === opt.role ? 'default' : 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: '14px',
                      opacity: selectedUser.role === opt.role ? 0.7 : 1,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {ROLE_LABELS[opt.role]}
                        {selectedUser.role === opt.role && <span style={{ color: 'var(--primary-600)', marginLeft: '8px', fontSize: '0.8rem' }}>Current</span>}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{opt.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared Styles ─────────────────────────────────────────────── */
const thStyle = {
  padding: '14px 20px', textAlign: 'left', fontSize: '0.78rem',
  fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase',
  letterSpacing: '0.05em', background: 'var(--bg-secondary)'
};

const tdStyle = { padding: '14px 20px' };

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 2000, animation: 'fadeIn 0.15s ease-out', backdropFilter: 'blur(4px)'
};

const modalStyle = {
  background: 'white', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
  width: '90%', maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden',
  animation: 'slideUp 0.2s ease-out'
};

const closeBtn = {
  background: 'var(--bg-tertiary)', border: 'none', width: '32px', height: '32px',
  borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-tertiary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s'
};
