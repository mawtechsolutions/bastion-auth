'use client';

import { useState, useRef, useEffect } from 'react';

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Sample notifications data
const sampleNotifications = [
  {
    id: '1',
    title: 'New user registered',
    message: 'john.doe@example.com just signed up',
    time: '2 minutes ago',
    read: false,
    type: 'user',
  },
  {
    id: '2',
    title: 'Security alert',
    message: 'Multiple failed login attempts detected',
    time: '15 minutes ago',
    read: false,
    type: 'security',
  },
  {
    id: '3',
    title: 'Webhook delivery failed',
    message: 'Failed to deliver event to endpoint',
    time: '1 hour ago',
    read: true,
    type: 'webhook',
  },
];

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(sampleNotifications);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleSignOut = async () => {
    const signOutUrl = process.env.NEXT_PUBLIC_SIGN_OUT_REDIRECT_URL || 'http://localhost:3000/sign-in';
    const apiUrl = process.env.NEXT_PUBLIC_BASTION_API_URL || 'http://localhost:3001';
    
    try {
      // Clear any stored tokens
      localStorage.removeItem('bastionauth_token');
      localStorage.removeItem('bastionauth_refresh_token');
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Call the API to invalidate the session on the server
      try {
        await fetch(`${apiUrl}/api/v1/auth/sign-out`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // API call failed, but we still want to clear local state
        console.log('API sign-out failed, clearing local state only');
      }

      // Close the dropdown
      setUserMenuOpen(false);

      // Redirect to sign-in page
      window.location.href = signOutUrl;
    } catch (error) {
      console.error('Sign out failed:', error);
      // Still redirect even if there was an error
      window.location.href = signOutUrl;
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <div className="search-container">
          <span className="search-icon"><SearchIcon /></span>
          <input 
            type="text" 
            placeholder="Search users, organizations..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>
      
      <div className="header-center">
        <span className="header-env">
          <span className="env-dot" />
          Development
        </span>
      </div>

      <div className="header-right">
        {/* Notifications Dropdown */}
        <div className="dropdown-container" ref={notificationRef}>
          <button 
            className="header-button notification-btn"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserMenuOpen(false);
            }}
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
          >
            <BellIcon />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>
          
          {notificationsOpen && (
            <div className="dropdown-menu notifications-dropdown">
              <div className="dropdown-header">
                <span className="dropdown-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="mark-read-btn" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="empty-notifications">
                    <BellIcon />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="notification-indicator">
                        {!notification.read && <span className="unread-dot" />}
                      </div>
                      <div className="notification-content">
                        <span className="notification-title">{notification.title}</span>
                        <span className="notification-message">{notification.message}</span>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <a href="/audit-logs" className="dropdown-footer">
                View all activity
              </a>
            </div>
          )}
        </div>

        <div className="header-divider" />

        {/* User Menu Dropdown */}
        <div className="dropdown-container" ref={userMenuRef}>
          <button 
            className="header-user"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotificationsOpen(false);
            }}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="avatar">
              <span>A</span>
            </div>
            <span className="user-name">Admin</span>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={`chevron ${userMenuOpen ? 'rotated' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {userMenuOpen && (
            <div className="dropdown-menu user-dropdown">
              <div className="user-info">
                <div className="user-info-avatar">
                  <span>A</span>
                </div>
                <div className="user-info-details">
                  <span className="user-info-name">Admin User</span>
                  <span className="user-info-email">admin@bastionauth.dev</span>
                </div>
              </div>
              <div className="dropdown-divider" />
              <a href="/settings" className="dropdown-item">
                <UserIcon />
                <span>Profile</span>
              </a>
              <a href="/settings" className="dropdown-item">
                <SettingsIcon />
                <span>Settings</span>
              </a>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleSignOut}>
                <LogOutIcon />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-header {
          position: relative;
          z-index: 100;
          height: var(--header-height);
          border-bottom: 1px solid rgba(0, 240, 255, 0.1);
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }

        .header-left {
          flex: 1;
          max-width: 400px;
        }

        .search-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: rgba(248, 250, 252, 0.4);
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 0.625rem 1rem 0.625rem 2.75rem;
          font-size: 0.875rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 10px;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input::placeholder {
          color: rgba(248, 250, 252, 0.3);
        }

        .search-input:focus {
          border-color: rgba(0, 240, 255, 0.3);
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.1);
        }

        .search-kbd {
          position: absolute;
          right: 0.75rem;
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: rgba(248, 250, 252, 0.4);
          font-family: inherit;
        }

        .header-center {
          display: flex;
          align-items: center;
        }

        .header-env {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
        }

        .env-dot {
          width: 6px;
          height: 6px;
          background: #F59E0B;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .header-button {
          position: relative;
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(248, 250, 252, 0.6);
          transition: all 0.2s ease;
        }

        .header-button:hover {
          background: rgba(0, 240, 255, 0.05);
          border-color: rgba(0, 240, 255, 0.2);
          color: rgba(248, 250, 252, 0.9);
        }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #EF4444;
          border-radius: 50%;
          border: 2px solid rgba(15, 23, 42, 0.8);
        }

        .header-divider {
          width: 1px;
          height: 24px;
          background: rgba(0, 240, 255, 0.1);
        }

        .header-user {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.375rem 0.75rem 0.375rem 0.375rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(248, 250, 252, 0.6);
        }

        .header-user:hover {
          background: rgba(0, 240, 255, 0.05);
          border-color: rgba(0, 240, 255, 0.2);
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #00F0FF, #A855F7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 600;
          color: white;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .chevron {
          transition: transform 0.2s ease;
        }

        .chevron.rotated {
          transform: rotate(180deg);
        }

        /* Dropdown Styles */
        .dropdown-container {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(0, 240, 255, 0.15);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 240, 255, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 9999;
          overflow: hidden;
          animation: dropdownFadeIn 0.15s ease-out;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Notifications Dropdown */
        .notifications-dropdown {
          width: 360px;
          max-height: 480px;
          display: flex;
          flex-direction: column;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid rgba(0, 240, 255, 0.1);
        }

        .dropdown-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .mark-read-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          color: #00F0FF;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .mark-read-btn:hover {
          background: rgba(0, 240, 255, 0.1);
        }

        .notifications-list {
          flex: 1;
          overflow-y: auto;
          max-height: 320px;
        }

        .notification-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid rgba(0, 240, 255, 0.05);
        }

        .notification-item:hover {
          background: rgba(0, 240, 255, 0.05);
        }

        .notification-item.unread {
          background: rgba(0, 240, 255, 0.03);
        }

        .notification-indicator {
          width: 8px;
          display: flex;
          align-items: flex-start;
          padding-top: 6px;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          background: #00F0FF;
          border-radius: 50%;
        }

        .notification-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .notification-title {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .notification-message {
          font-size: 0.75rem;
          color: rgba(248, 250, 252, 0.5);
          line-height: 1.4;
        }

        .notification-time {
          font-size: 0.6875rem;
          color: rgba(248, 250, 252, 0.35);
          margin-top: 0.25rem;
        }

        .empty-notifications {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          color: rgba(248, 250, 252, 0.3);
        }

        .empty-notifications p {
          margin-top: 0.75rem;
          font-size: 0.875rem;
        }

        .dropdown-footer {
          display: block;
          text-align: center;
          padding: 0.875rem;
          font-size: 0.8125rem;
          color: #00F0FF;
          text-decoration: none;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
          transition: background 0.15s ease;
        }

        .dropdown-footer:hover {
          background: rgba(0, 240, 255, 0.05);
        }

        /* User Dropdown */
        .user-dropdown {
          width: 240px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
        }

        .user-info-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #00F0FF, #A855F7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 600;
          color: white;
        }

        .user-info-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .user-info-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .user-info-email {
          font-size: 0.75rem;
          color: rgba(248, 250, 252, 0.5);
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(0, 240, 255, 0.1);
          margin: 0.25rem 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.8);
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .dropdown-item:hover {
          background: rgba(0, 240, 255, 0.05);
          color: var(--text-primary);
        }

        .dropdown-item.danger {
          color: #EF4444;
        }

        .dropdown-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #F87171;
        }
      `}</style>
    </header>
  );
}
