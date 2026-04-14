import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ collapsed, mobileOpen, onToggle, onMobileClose }) {
  const { user, isAdmin, isCitizen, isSuperAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 199, display: 'block'
          }}
          onClick={onMobileClose}
        />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🏛</div>
          {!collapsed && (
            <div className="sidebar-brand">
              BAQTS
              <span>{user?.tenant?.name || 'System Admin'}</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {/* Citizen Navigation */}
          {isCitizen && (
            <div className="sidebar-section">
              {!collapsed && <div className="sidebar-section-title">Menu</div>}
              <NavLink
                to="/citizen"
                className={`sidebar-link ${isActive('/citizen') ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <span className="sidebar-link-icon">📋</span>
                {!collapsed && 'My Applications'}
              </NavLink>
              <NavLink
                to="/citizen/apply"
                className={`sidebar-link ${isActive('/citizen/apply') ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <span className="sidebar-link-icon">📝</span>
                {!collapsed && 'Apply for Assistance'}
              </NavLink>
              <NavLink
                to="/track"
                className={`sidebar-link ${isActive('/track') ? 'active' : ''}`}
                onClick={onMobileClose}
              >
                <span className="sidebar-link-icon">🔍</span>
                {!collapsed && 'Track Application'}
              </NavLink>
            </div>
          )}

          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <div className="sidebar-section">
                {!collapsed && <div className="sidebar-section-title">Dashboard</div>}
                <NavLink
                  to="/admin"
                  className={`sidebar-link ${isActive('/admin') ? 'active' : ''}`}
                  onClick={onMobileClose}
                >
                  <span className="sidebar-link-icon">📊</span>
                  {!collapsed && 'Dashboard'}
                </NavLink>
              </div>

              <div className="sidebar-section">
                {!collapsed && <div className="sidebar-section-title">Management</div>}
                <NavLink
                  to="/admin/queue"
                  className={`sidebar-link ${isActive('/admin/queue') ? 'active' : ''}`}
                  onClick={onMobileClose}
                >
                  <span className="sidebar-link-icon">📑</span>
                  {!collapsed && 'Queue Management'}
                </NavLink>
                <NavLink
                  to="/admin/reports"
                  className={`sidebar-link ${isActive('/admin/reports') ? 'active' : ''}`}
                  onClick={onMobileClose}
                >
                  <span className="sidebar-link-icon">📈</span>
                  {!collapsed && 'Reports & Analytics'}
                </NavLink>
              </div>
            </>
          )}

          {/* Common Links */}
          <div className="sidebar-section">
            {!collapsed && <div className="sidebar-section-title">Public</div>}
            <NavLink
              to="/transparency"
              className={`sidebar-link ${isActive('/transparency') ? 'active' : ''}`}
              onClick={onMobileClose}
            >
              <span className="sidebar-link-icon">🌐</span>
              {!collapsed && 'Transparency Board'}
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-toggle" onClick={onToggle}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
      </aside>
    </>
  );
}
