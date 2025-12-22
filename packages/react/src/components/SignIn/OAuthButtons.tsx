
import { useBastionContext } from '../../context/BastionProvider.js';

interface OAuthButtonsProps {
  mode: 'sign-in' | 'sign-up';
}

const OAUTH_PROVIDERS = [
  { id: 'google', name: 'Google', icon: GoogleIcon },
  { id: 'github', name: 'GitHub', icon: GitHubIcon },
];

export function OAuthButtons({ mode }: OAuthButtonsProps) {
  const { client } = useBastionContext();

  const handleOAuth = (provider: string) => {
    const url = client.getOAuthUrl(provider);
    console.log('OAuth URL:', url);
    window.location.href = url;
  };

  return (
    <div className="bastion-oauth-buttons">
      {OAUTH_PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => handleOAuth(provider.id)}
          className="bastion-button bastion-button--oauth"
        >
          <provider.icon />
          <span>Continue with {provider.name}</span>
        </button>
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0C4.037 0 0 4.037 0 9c0 3.975 2.578 7.35 6.154 8.541.45.082.615-.195.615-.434 0-.214-.008-.78-.012-1.531-2.504.544-3.032-1.207-3.032-1.207-.41-1.04-1-1.316-1-1.316-.817-.559.062-.547.062-.547.903.063 1.378.927 1.378.927.803 1.376 2.107.978 2.62.748.082-.582.314-.978.571-1.203-1.999-.227-4.102-1-4.102-4.448 0-.983.351-1.786.927-2.416-.093-.228-.402-1.143.088-2.382 0 0 .755-.242 2.475.923A8.632 8.632 0 019 4.352c.765.004 1.535.103 2.254.303 1.72-1.165 2.474-.923 2.474-.923.49 1.24.182 2.154.089 2.382.577.63.926 1.433.926 2.416 0 3.458-2.106 4.218-4.112 4.441.323.278.611.828.611 1.669 0 1.204-.011 2.175-.011 2.471 0 .241.163.52.619.432C15.425 16.347 18 12.973 18 9c0-4.963-4.037-9-9-9z"
      />
    </svg>
  );
}

