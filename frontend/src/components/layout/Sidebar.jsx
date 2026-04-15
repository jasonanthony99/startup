import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import { getInitials } from '../../utils/helpers';

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }) {
  const { user, isAdmin, isCitizen } = useAuth();
  const location = useLocation();
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (user?.role === 'barangay_admin') {
      const fetchUnreadCount = async () => {
        try {
          const res = await chatAPI.adminGetUnreadCount();
          setAdminUnreadCount(res.data.unread_count);
        } catch (err) {
          console.error('Failed to fetch admin unread count');
        }
      };

      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const citizenLinks = [
    { to: '/citizen', icon: '📋', label: 'My Applications', end: true },
    { to: '/citizen/apply', icon: '📝', label: 'Apply for Assistance' },
    { to: '/citizen/request-document', icon: '📑', label: 'Request Document' },
    { to: '/citizen/documents', icon: '📄', label: 'My Documents' },
  ];

  const adminLinks = [
    { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
    { to: '/admin/users', icon: '👥', label: 'Residents' },
    { to: '/admin/queue', icon: '📑', label: 'Queue' },
    { to: '/admin/document-requests', icon: '📄', label: 'Documents' },
    { to: '/admin/reports', icon: '📈', label: 'Reports' },
    { to: '/admin/messages', icon: '💬', label: 'Inquiries', badge: adminUnreadCount },
    { to: '/admin/assistance-types', icon: '🤝', label: 'Programs' },
    { to: '/admin/document-types', icon: '📋', label: 'Doc Types' },
  ];

  const superAdminLinks = [
    { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
    { to: '/admin/tenants', icon: '🏢', label: 'Barangays' },
  ];

  const commonLinks = [
    { to: '/transparency', icon: '🌐', label: 'Transparency' },
  ];

  const navLinks = isCitizen ? citizenLinks
    : user?.role === 'super_admin' ? superAdminLinks
    : user?.role === 'barangay_admin' ? adminLinks
    : [];

  const sectionTitle = isCitizen ? 'Navigation'
    : user?.role === 'super_admin' ? 'System'
    : 'Management';

  return (
    <>
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 199, backdropFilter: 'blur(4px)' }}
          onClick={onMobileClose}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* ── Brand Header ────────────────────────────────────── */}
        <div className="sidebar-header">
          <div className="sidebar-logo">🏛</div>
          {!collapsed && (
            <div className="sidebar-brand">
              BAQTS
              <span>{user?.tenant?.name || 'System Admin'}</span>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────── */}
        <nav className="sidebar-nav">
          {/* Primary Links */}
          <div className="sidebar-section">
            {!collapsed && <div className="sidebar-section-title">{sectionTitle}</div>}
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                {!collapsed && (
                  <span className="sidebar-link-text" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {link.label}
                    {link.badge > 0 && (
                      <span className="badge badge-danger" style={{ 
                        marginLeft: '8px', 
                        minWidth: '20px', 
                        height: '20px', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        padding: '0 6px'
                      }}>
                        {link.badge}
                      </span>
                    )}
                  </span>
                )}
                {!collapsed && isActive(link.to) && <span className="sidebar-active-dot" />}
              </NavLink>
            ))}
          </div>

          {/* Divider + Public Links */}
          {!collapsed && <div className="sidebar-divider" />}
          <div className="sidebar-section">
            {!collapsed && <div className="sidebar-section-title">Public</div>}
            {commonLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <span className="sidebar-link-icon">{link.icon}</span>
                {!collapsed && <span className="sidebar-link-text">{link.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ── Collapse Toggle ─────────────────────────────────── */}
        <div className="sidebar-footer">
          <button className="sidebar-toggle" onClick={onToggle}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>
      </aside>
    </>
  );
}
