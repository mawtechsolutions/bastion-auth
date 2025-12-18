'use client';

export function Header() {
  return (
    <header className="admin-header">
      <div className="header-left">
        <span className="header-env">Development</span>
      </div>
      <div className="header-right">
        <button className="header-button">
          🔔
        </button>
        <div className="header-user">
          <div className="avatar">
            <span>A</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-header {
          height: var(--header-height);
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-secondary);
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-env {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--accent-warning);
          background: rgba(245, 158, 11, 0.15);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-button {
          width: 36px;
          height: 36px;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-button:hover {
          background: var(--bg-tertiary);
        }

        .header-user {
          cursor: pointer;
        }
      `}</style>
    </header>
  );
}

