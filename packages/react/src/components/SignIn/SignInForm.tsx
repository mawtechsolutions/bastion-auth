
interface SignInFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
}

export function SignInForm({
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
}: SignInFormProps) {
  return (
    <>
      <div className="bastion-form-field">
        <label htmlFor="email" className="bastion-label">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="bastion-input"
          placeholder="you@example.com"
        />
      </div>

      <div className="bastion-form-field">
        <label htmlFor="password" className="bastion-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="bastion-input"
          placeholder="••••••••"
        />
      </div>

      <a href="/forgot-password" className="bastion-forgot-link">
        Forgot password?
      </a>

      <button
        type="submit"
        disabled={isLoading}
        className="bastion-button bastion-button--primary"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </>
  );
}

