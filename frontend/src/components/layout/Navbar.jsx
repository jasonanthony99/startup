import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';
import { getInitials, timeAgo } from '../../utils/helpers';

export default function Navbar({ sidebarCollapsed, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationsAPI.unreadCount();
        setUnreadCount(res.data.unread_count);
      } catch {
        // silently fail
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
    if (!showNotifications) {
      try {
        const res = await notificationsAPI.list({ per_page: 10 });
        setNotifications(res.data.data || []);
      } catch {
        // silently fail
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // silently fail
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className={`navbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="navbar-left">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onMenuClick}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          ☰
        </button>
        <div className="navbar-title">
          {user?.role === 'citizen' ? 'Citizen Portal' : 'Admin Portal'}
        </div>
      </div>

      <div className="navbar-right">
        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="notification-bell" onClick={toggleNotifications} id="notification-bell">
            🔔
            {unreadCount > 0 && (
              <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                {unreadCount > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No notifications yet
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  >
                    <div className="notification-item-title">{notif.title}</div>
                    <div className="notification-item-message">{notif.message}</div>
                    <div className="notification-item-time">{timeAgo(notif.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            className="navbar-user"
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            id="user-menu-btn"
          >
            <div className="navbar-user-avatar">
              {getInitials(user?.name)}
            </div>
            <span>{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="notification-dropdown" style={{ width: '200px' }}>
              <div style={{ padding: 'var(--space-sm)' }}>
                <div style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {user?.email}
                </div>
                <div style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  Role: {user?.role?.replace('_', ' ')}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', marginTop: '4px', color: 'var(--accent-red)' }}
                  onClick={handleLogout}
                  id="logout-btn"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
