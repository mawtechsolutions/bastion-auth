'use client';

import { useState } from 'react';
import { GlassCard, GlassButton } from '@mawtech/glass-ui';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: <SettingsIcon /> },
    { id: 'security', label: 'Security', icon: <ShieldIcon /> },
    { id: 'email', label: 'Email', icon: <MailIcon /> },
    { id: 'oauth', label: 'OAuth Providers', icon: <KeyIcon /> },
    { id: 'branding', label: 'Branding', icon: <PaletteIcon /> },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Configure your BastionAuth instance</p>
      </div>

      <div className="settings-layout">
        <GlassCard variant="glow" padding="sm" className="settings-nav-card">
          <nav className="settings-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </GlassCard>

        <div className="settings-content">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'email' && <EmailSettings />}
          {activeTab === 'oauth' && <OAuthSettings />}
          {activeTab === 'branding' && <BrandingSettings />}
        </div>
      </div>

      <style jsx>{`
        .page-header {
          margin-bottom: 2rem;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
          align-items: start;
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
          border-radius: 10px;
          color: rgba(248, 250, 252, 0.6);
          font-size: 0.9375rem;
          font-weight: 500;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.7;
        }
        
        .settings-nav-item:hover {
          background: rgba(0, 240, 255, 0.05);
          color: rgba(248, 250, 252, 0.9);
        }
        
        .settings-nav-item.active {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.15), rgba(168, 85, 247, 0.1));
          color: #00F0FF;
          border: 1px solid rgba(0, 240, 255, 0.2);
        }

        .settings-nav-item.active .nav-icon {
          opacity: 1;
        }

        @media (max-width: 900px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }

          .settings-nav {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
        }
      `}</style>
    </>
  );
}

function GeneralSettings() {
  return (
    <GlassCard variant="glow" padding="lg">
      <div className="card-header">
        <h2 className="card-title">General Settings</h2>
        <p className="card-subtitle">Basic configuration for your authentication system</p>
      </div>
      
      <div className="settings-section">
        <SettingRow
          label="Application Name"
          description="The name displayed in emails and UI"
        >
          <input type="text" className="input" defaultValue="BastionAuth" />
        </SettingRow>

        <SettingRow
          label="Application URL"
          description="The base URL of your application"
        >
          <input type="url" className="input" defaultValue="https://bastionauth.dev" />
        </SettingRow>

        <SettingRow
          label="Support Email"
          description="Email address for user support inquiries"
        >
          <input type="email" className="input" placeholder="support@example.com" />
        </SettingRow>
      </div>

      <div className="settings-actions">
        <GlassButton variant="primary">Save Changes</GlassButton>
      </div>

      <style jsx>{`
        .card-header {
          margin-bottom: 2rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .settings-section {
          display: flex;
          flex-direction: column;
          margin-bottom: 2rem;
        }

        .settings-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
        }
      `}</style>
    </GlassCard>
  );
}

function SecuritySettings() {
  return (
    <GlassCard variant="glow" padding="lg">
      <div className="card-header">
        <h2 className="card-title">Security Settings</h2>
        <p className="card-subtitle">Configure security policies and authentication rules</p>
      </div>
      
      <div className="settings-section">
        <SettingRow
          label="Require MFA for Admins"
          description="Force all admin users to enable MFA"
        >
          <Toggle defaultChecked />
        </SettingRow>

        <SettingRow
          label="Password Breach Detection"
          description="Check passwords against known breaches"
        >
          <Toggle defaultChecked />
        </SettingRow>

        <SettingRow
          label="Session Timeout"
          description="Auto-expire inactive sessions"
        >
          <select className="input select-input" defaultValue="7d">
            <option value="1h">1 hour</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>
        </SettingRow>

        <SettingRow
          label="Max Sessions per User"
          description="Limit active sessions per user"
        >
          <input type="number" className="input number-input" defaultValue={5} min={1} max={100} />
        </SettingRow>

        <SettingRow
          label="Rate Limiting"
          description="Enable rate limiting for auth endpoints"
        >
          <Toggle defaultChecked />
        </SettingRow>
      </div>

      <div className="settings-actions">
        <GlassButton variant="primary">Save Changes</GlassButton>
      </div>

      <style jsx>{`
        .card-header {
          margin-bottom: 2rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .settings-section {
          display: flex;
          flex-direction: column;
          margin-bottom: 2rem;
        }

        .select-input {
          width: 160px;
        }

        .number-input {
          width: 100px;
        }

        .settings-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
        }
      `}</style>
    </GlassCard>
  );
}

function EmailSettings() {
  return (
    <GlassCard variant="glow" padding="lg">
      <div className="card-header">
        <h2 className="card-title">Email Settings</h2>
        <p className="card-subtitle">Configure your email provider and templates</p>
      </div>
      
      <div className="settings-section">
        <SettingRow
          label="Email Provider"
          description="Service used for transactional emails"
        >
          <select className="input select-input" defaultValue="resend">
            <option value="resend">Resend</option>
            <option value="sendgrid">SendGrid</option>
            <option value="mailgun">Mailgun</option>
            <option value="ses">Amazon SES</option>
          </select>
        </SettingRow>

        <SettingRow
          label="API Key"
          description="Your email provider API key"
        >
          <input type="password" className="input" placeholder="••••••••••••••••" />
        </SettingRow>

        <SettingRow
          label="From Email"
          description="Sender email address"
        >
          <input type="email" className="input" placeholder="noreply@example.com" />
        </SettingRow>

        <SettingRow
          label="From Name"
          description="Sender name displayed in emails"
        >
          <input type="text" className="input" placeholder="BastionAuth" />
        </SettingRow>
      </div>

      <div className="settings-actions">
        <GlassButton variant="secondary">Send Test Email</GlassButton>
        <GlassButton variant="primary">Save Changes</GlassButton>
      </div>

      <style jsx>{`
        .card-header {
          margin-bottom: 2rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .settings-section {
          display: flex;
          flex-direction: column;
          margin-bottom: 2rem;
        }

        .select-input {
          width: 180px;
        }

        .settings-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
        }
      `}</style>
    </GlassCard>
  );
}

function OAuthSettings() {
  const providers = [
    { id: 'google', name: 'Google', icon: <GoogleIcon />, enabled: true },
    { id: 'github', name: 'GitHub', icon: <GitHubIcon />, enabled: true },
    { id: 'microsoft', name: 'Microsoft', icon: <MicrosoftIcon />, enabled: false },
    { id: 'apple', name: 'Apple', icon: <AppleIcon />, enabled: false },
  ];

  return (
    <GlassCard variant="glow" padding="lg">
      <div className="card-header">
        <h2 className="card-title">OAuth Providers</h2>
        <p className="card-subtitle">Configure social login providers</p>
      </div>
      
      <div className="provider-list">
        {providers.map((provider) => (
          <div key={provider.id} className={`provider-item ${provider.enabled ? 'enabled' : ''}`}>
            <div className="provider-info">
              <span className="provider-icon">{provider.icon}</span>
              <div className="provider-details">
                <span className="provider-name">{provider.name}</span>
                <span className={`provider-status ${provider.enabled ? 'configured' : 'not-configured'}`}>
                  {provider.enabled ? '✓ Configured' : 'Not configured'}
                </span>
              </div>
            </div>
            <GlassButton variant={provider.enabled ? 'secondary' : 'primary'} className="btn-sm">
              {provider.enabled ? 'Edit' : 'Configure'}
            </GlassButton>
          </div>
        ))}
      </div>

      <style jsx>{`
        .card-header {
          margin-bottom: 2rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .provider-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .provider-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(0, 240, 255, 0.1);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .provider-item.enabled {
          border-color: rgba(16, 185, 129, 0.2);
        }

        .provider-item:hover {
          background: rgba(0, 240, 255, 0.03);
          border-color: rgba(0, 240, 255, 0.2);
        }
        
        .provider-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .provider-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .provider-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        
        .provider-name {
          font-weight: 500;
          color: var(--text-primary);
        }
        
        .provider-status {
          font-size: 0.8125rem;
        }
        
        .provider-status.configured {
          color: #10B981;
        }
        
        .provider-status.not-configured {
          color: rgba(248, 250, 252, 0.4);
        }
      `}</style>
    </GlassCard>
  );
}

function BrandingSettings() {
  return (
    <GlassCard variant="glow" padding="lg">
      <div className="card-header">
        <h2 className="card-title">Branding</h2>
        <p className="card-subtitle">Customize the look and feel of your auth pages</p>
      </div>
      
      <div className="settings-section">
        <SettingRow
          label="Logo"
          description="Upload your company logo"
        >
          <div className="upload-area">
            <UploadIcon />
            <span className="upload-text">Click to upload</span>
          </div>
        </SettingRow>

        <SettingRow
          label="Primary Color"
          description="Main accent color for UI elements"
        >
          <div className="color-picker">
            <input type="color" defaultValue="#00F0FF" className="color-input" />
            <input type="text" className="input color-text" defaultValue="#00F0FF" />
          </div>
        </SettingRow>

        <SettingRow
          label="Favicon"
          description="Icon shown in browser tabs"
        >
          <div className="upload-area upload-small">
            <UploadIcon />
          </div>
        </SettingRow>
      </div>

      <div className="settings-actions">
        <GlassButton variant="primary">Save Changes</GlassButton>
      </div>

      <style jsx>{`
        .card-header {
          margin-bottom: 2rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .settings-section {
          display: flex;
          flex-direction: column;
          margin-bottom: 2rem;
        }
        
        .upload-area {
          width: 200px;
          height: 100px;
          border: 2px dashed rgba(0, 240, 255, 0.2);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          color: rgba(248, 250, 252, 0.4);
        }
        
        .upload-area:hover {
          border-color: rgba(0, 240, 255, 0.4);
          background: rgba(0, 240, 255, 0.03);
          color: rgba(248, 250, 252, 0.7);
        }
        
        .upload-area.upload-small {
          width: 64px;
          height: 64px;
        }
        
        .upload-text {
          font-size: 0.8125rem;
        }

        .color-picker {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .color-input {
          width: 48px;
          height: 40px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          background: transparent;
        }

        .color-text {
          width: 100px;
          font-family: 'SF Mono', Menlo, monospace;
        }
        
        .settings-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid rgba(0, 240, 255, 0.1);
        }
      `}</style>
    </GlassCard>
  );
}

// Helper Components
function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <label className="setting-label">{label}</label>
        <p className="setting-description">{description}</p>
      </div>
      <div className="setting-control">
        {children}
      </div>

      <style jsx>{`
        .setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 0;
          border-bottom: 1px solid rgba(0, 240, 255, 0.05);
        }

        .setting-row:last-child {
          border-bottom: none;
        }

        .setting-info {
          flex: 1;
        }

        .setting-label {
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          display: block;
        }

        .setting-description {
          font-size: 0.8125rem;
          color: rgba(248, 250, 252, 0.4);
        }

        .setting-control {
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <button 
      className={`toggle ${checked ? 'active' : ''}`}
      onClick={() => setChecked(!checked)}
      type="button"
    >
      <span className="toggle-knob" />
      
      <style jsx>{`
        .toggle {
          position: relative;
          width: 48px;
          height: 26px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 26px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle.active {
          background: linear-gradient(135deg, #00F0FF, #A855F7);
          border-color: transparent;
        }

        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .toggle.active .toggle-knob {
          transform: translateX(22px);
        }
      `}</style>
    </button>
  );
}

// Icons
function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
