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
  const [isBadgeHidden, setIsBadgeHidden] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationsAPI.unreadCount();
        const newCount = res.data.unread_count;
        setUnreadCount(prev => {
          if (newCount > prev) {
            setIsBadgeHidden(false); // New notification arrived, show badge
          }
          return newCount;
        });
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
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    setShowUserMenu(false);
    
    if (nextState) {
      setIsBadgeHidden(true); // User opened the dropdown, hide the badge
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

  const handleNotificationClick = async (notif) => {
    // 1. Close the dropdown
    setShowNotifications(false);
    
    // 2. Mark as read if not already
    if (!notif.is_read) {
      try {
        await notificationsAPI.markAsRead(notif.id);
        // Optimize UI: update local state immediately
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read');
      }
    }

    // 3. Redirect if URL exists, or use fallback based on type
    if (notif.redirect_url) {
      navigate(notif.redirect_url);
    } else {
      // Fallback for legacy notifications
      if (notif.type === 'status_update') {
        navigate(user?.role === 'citizen' ? '/citizen' : '/admin');
      } else if (notif.type === 'system') {
        navigate(user?.role === 'citizen' ? '/citizen' : '/admin');
      } else if (notif.type === 'announcement') {
        navigate('/transparency');
      }
    }
  };

  const handleClearAll = async () => {
    try {
      await notificationsAPI.clearAll();
      setUnreadCount(0);
      setNotifications([]);
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
          <button 
            className={`notification-bell ${showNotifications ? 'active' : ''}`} 
            onClick={toggleNotifications} 
            id="notification-bell" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'color 0.2s' }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && !isBadgeHidden && (
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
              
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="notification-item-title">{notif.title}</div>
                      <div className="notification-item-message">{notif.message}</div>
                      <div className="notification-item-time">{timeAgo(notif.created_at)}</div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div style={{ 
                  padding: 'var(--space-sm)', 
                  borderTop: '1px solid var(--border-color)',
                  textAlign: 'center',
                  background: 'var(--bg-tertiary)'
                }}>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={handleClearAll}
                    style={{ width: '100%', color: 'var(--accent-red)', fontSize: '0.75rem' }}
                  >
                    🗑️ Clear all notifications
                  </button>
                </div>
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
              {user?.profile_photo_url ? (
                <img src={user.profile_photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <span>{user?.name}</span>
          </button>

          {showUserMenu && (
            <div className="notification-dropdown" style={{ width: '200px' }}>
              <div style={{ padding: 'var(--space-sm)' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', marginTop: '8px' }}
                  onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                >
                  👤 My Profile
                </button>
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
