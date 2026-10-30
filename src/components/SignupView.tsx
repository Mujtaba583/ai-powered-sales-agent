import React, { useState } from 'react';

interface SignupViewProps {
  onSuccess: (user?: any) => void;
  onNavigateToLogin: () => void;
}

export const SignupView: React.FC<SignupViewProps> = ({ onSuccess, onNavigateToLogin }) => {
  const [business, setBusiness] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: business, email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || data.message || 'Could not create account');
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

  return (
    <main className="auth-page">
      <div className="container auth-grid">
        <section className="form-card">
          <h1>Create account</h1>
          <p>Set up the business owner profile.</p>

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

          <form data-signup-form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="business">Business name</label>
              <input
                className="input"
                id="business"
                type="text"
                placeholder="Bright Solar Solutions"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                required
              />
            </div>
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
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Account'}
              </button>
              <button
                className="btn btn-soft"
                type="button"
                onClick={onNavigateToLogin}
              >
                Already Have an Account
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
