import React, { useState } from 'react';

interface LoginViewProps {
  onSuccess: (user?: any) => void;
  onNavigateToSignup: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || data.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onSuccess(data.user);
    } catch {
      setError('Could not connect to authentication server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@solarsales.com');
    setPassword('solar123');
  };

  return (
    <main className="auth-page">
      <div className="container auth-grid">
        <section className="form-card">
          <h1>Login</h1>
          <p>Access the business owner dashboard.</p>

          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <form data-login-form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                className="input"
                id="email"
                type="email"
                placeholder="owner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '8px 0 16px',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ color: 'var(--muted)' }}>Demo: admin@solarsales.com / solar123</span>
              <button
                type="button"
                onClick={fillDemoAdmin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-700)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Auto-fill Demo
              </button>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Continue to Dashboard'}
              </button>
              <button
                className="btn btn-soft"
                type="button"
                onClick={onNavigateToSignup}
              >
                Create New Account
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
