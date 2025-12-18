'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Configure your BastionAuth instance</p>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          <button
            className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            ⚙️ General
          </button>
          <button
            className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button
            className={`settings-nav-item ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            📧 Email
          </button>
          <button
            className={`settings-nav-item ${activeTab === 'oauth' ? 'active' : ''}`}
            onClick={() => setActiveTab('oauth')}
          >
            🔗 OAuth Providers
          </button>
          <button
            className={`settings-nav-item ${activeTab === 'branding' ? 'active' : ''}`}
            onClick={() => setActiveTab('branding')}
          >
            🎨 Branding
          </button>
        </nav>

        <div className="settings-content">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'email' && <EmailSettings />}
          {activeTab === 'oauth' && <OAuthSettings />}
          {activeTab === 'branding' && <BrandingSettings />}
        </div>
      </div>

      <style jsx>{`
        .settings-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 2rem;
        }
        
        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 0.9375rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .settings-nav-item:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
        
        .settings-nav-item.active {
          background: var(--accent-primary);
          color: white;
        }
      `}</style>
    </>
  );
}

function GeneralSettings() {
  return (
    <div className="card">
      <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>General Settings</h2>
      
      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Application Name</label>
            <p className="setting-description">The name displayed in emails and UI</p>
          </div>
          <input type="text" className="input" defaultValue="BastionAuth" style={{ width: '300px' }} />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Application URL</label>
            <p className="setting-description">The base URL of your application</p>
          </div>
          <input type="url" className="input" defaultValue="https://bastionauth.dev" style={{ width: '300px' }} />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Support Email</label>
            <p className="setting-description">Email address for user support inquiries</p>
          </div>
          <input type="email" className="input" placeholder="support@example.com" style={{ width: '300px' }} />
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary">Save Changes</button>
      </div>

      <style jsx>{`
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .setting-item:last-child {
          border-bottom: none;
        }
        
        .setting-label {
          font-weight: 500;
          margin-bottom: 0.25rem;
          display: block;
        }
        
        .setting-description {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        
        .settings-actions {
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="card">
      <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Security Settings</h2>
      
      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Require MFA for Admins</label>
            <p className="setting-description">Force all admin users to enable MFA</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Password Breach Detection</label>
            <p className="setting-description">Check passwords against known breaches (HaveIBeenPwned)</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Session Timeout</label>
            <p className="setting-description">Auto-expire inactive sessions after this duration</p>
          </div>
          <select className="input" defaultValue="7d" style={{ width: '200px' }}>
            <option value="1h">1 hour</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="never">Never</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Max Sessions per User</label>
            <p className="setting-description">Limit the number of active sessions per user</p>
          </div>
          <input type="number" className="input" defaultValue={5} min={1} max={100} style={{ width: '100px' }} />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Rate Limiting</label>
            <p className="setting-description">Enable rate limiting for authentication endpoints</p>
          </div>
          <label className="toggle">
            <input type="checkbox" defaultChecked />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary">Save Changes</button>
      </div>

      <style jsx>{`
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .setting-item:last-child {
          border-bottom: none;
        }
        
        .setting-label {
          font-weight: 500;
          margin-bottom: 0.25rem;
          display: block;
        }
        
        .setting-description {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        
        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
        }
        
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--bg-tertiary);
          border-radius: 26px;
          transition: 0.15s;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          border-radius: 50%;
          transition: 0.15s;
        }
        
        .toggle input:checked + .toggle-slider {
          background-color: var(--accent-primary);
        }
        
        .toggle input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }
        
        .settings-actions {
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}

function EmailSettings() {
  return (
    <div className="card">
      <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Email Settings</h2>
      
      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Email Provider</label>
            <p className="setting-description">The service used to send transactional emails</p>
          </div>
          <select className="input" defaultValue="resend" style={{ width: '200px' }}>
            <option value="resend">Resend</option>
            <option value="sendgrid">SendGrid</option>
            <option value="mailgun">Mailgun</option>
            <option value="ses">Amazon SES</option>
          </select>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">API Key</label>
            <p className="setting-description">Your email provider API key</p>
          </div>
          <input type="password" className="input" placeholder="••••••••••••••••" style={{ width: '300px' }} />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">From Email</label>
            <p className="setting-description">The sender email address for all outgoing emails</p>
          </div>
          <input type="email" className="input" placeholder="noreply@example.com" style={{ width: '300px' }} />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">From Name</label>
            <p className="setting-description">The sender name displayed in emails</p>
          </div>
          <input type="text" className="input" placeholder="BastionAuth" style={{ width: '300px' }} />
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-ghost" style={{ marginRight: '0.75rem' }}>Send Test Email</button>
        <button className="btn btn-primary">Save Changes</button>
      </div>

      <style jsx>{`
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .setting-item:last-child {
          border-bottom: none;
        }
        
        .setting-label {
          font-weight: 500;
          margin-bottom: 0.25rem;
          display: block;
        }
        
        .setting-description {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        
        .settings-actions {
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}

function OAuthSettings() {
  const providers = [
    { id: 'google', name: 'Google', icon: '🔵', enabled: true },
    { id: 'github', name: 'GitHub', icon: '⚫', enabled: true },
    { id: 'microsoft', name: 'Microsoft', icon: '🟦', enabled: false },
    { id: 'apple', name: 'Apple', icon: '🍎', enabled: false },
    { id: 'linkedin', name: 'LinkedIn', icon: '🔗', enabled: false },
  ];

  return (
    <div className="card">
      <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>OAuth Providers</h2>
      
      <div className="provider-list">
        {providers.map((provider) => (
          <div key={provider.id} className="provider-item">
            <div className="provider-info">
              <span className="provider-icon">{provider.icon}</span>
              <div>
                <span className="provider-name">{provider.name}</span>
                <span className={`provider-status ${provider.enabled ? 'enabled' : 'disabled'}`}>
                  {provider.enabled ? 'Configured' : 'Not configured'}
                </span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm">
              {provider.enabled ? 'Edit' : 'Configure'}
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .provider-list {
          display: flex;
          flex-direction: column;
        }
        
        .provider-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .provider-item:last-child {
          border-bottom: none;
        }
        
        .provider-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .provider-icon {
          font-size: 1.5rem;
        }
        
        .provider-name {
          font-weight: 500;
          display: block;
        }
        
        .provider-status {
          font-size: 0.8125rem;
        }
        
        .provider-status.enabled {
          color: var(--accent-success);
        }
        
        .provider-status.disabled {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}

function BrandingSettings() {
  return (
    <div className="card">
      <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Branding</h2>
      
      <div className="settings-section">
        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Logo</label>
            <p className="setting-description">Upload your company logo (SVG or PNG recommended)</p>
          </div>
          <div className="upload-area">
            <span className="upload-icon">📤</span>
            <span className="upload-text">Click to upload</span>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Primary Color</label>
            <p className="setting-description">The main accent color for UI elements</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="color" defaultValue="#3b82f6" style={{ width: '48px', height: '36px', border: 'none', cursor: 'pointer' }} />
            <input type="text" className="input" defaultValue="#3b82f6" style={{ width: '100px' }} />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label className="setting-label">Favicon</label>
            <p className="setting-description">The icon shown in browser tabs</p>
          </div>
          <div className="upload-area upload-small">
            <span className="upload-icon">📤</span>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-primary">Save Changes</button>
      </div>

      <style jsx>{`
        .settings-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .setting-item:last-child {
          border-bottom: none;
        }
        
        .setting-label {
          font-weight: 500;
          margin-bottom: 0.25rem;
          display: block;
        }
        
        .setting-description {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        
        .upload-area {
          width: 200px;
          height: 100px;
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .upload-area:hover {
          border-color: var(--accent-primary);
          background: var(--bg-tertiary);
        }
        
        .upload-area.upload-small {
          width: 60px;
          height: 60px;
        }
        
        .upload-icon {
          font-size: 1.5rem;
        }
        
        .upload-text {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        
        .settings-actions {
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}

