'use client';

import { useState } from 'react';

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

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');

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
        <button className="header-button notification-btn">
          <BellIcon />
          <span className="notification-dot" />
        </button>
        <div className="header-divider" />
        <button className="header-user">
          <div className="avatar">
            <span>A</span>
          </div>
          <span className="user-name">Admin</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        .admin-header {
          height: var(--header-height);
          border-bottom: 1px solid rgba(0, 240, 255, 0.1);
          background: rgba(15, 23, 42, 0.6);
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
      `}</style>
    </header>
  );
}
