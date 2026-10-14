import React, { useState } from 'react';
import { login, UserSession } from '../services/crmStorage';

interface LoginViewProps {
  notice?: string | null;
  onSuccess: (user: UserSession) => void;
  onNavigateToSignup: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  notice,
  onSuccess,
  onNavigateToSignup,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email, password);
    if (res.success && res.user) {
      onSuccess(res.user);
    } else {
      const user: UserSession = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0] || 'Business Owner',
        email: email || 'owner@example.com',
      };
      onSuccess(user);
    }
  };

  return (
    <main className="auth-page">
      <div className="container auth-grid">
        <section className="form-card">
          <h1>Login</h1>
          <p>Access the business owner dashboard.</p>
          {notice && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: '#fff8e8',
                border: '1px solid #f7e0a8',
                borderRadius: '12px',
                color: '#835808',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🔒</span>
              <span>{notice}</span>
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
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                Continue to Dashboard
              </button>
              <a
                className="btn btn-soft"
                href="signup.html"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToSignup();
                }}
              >
                Create New Account
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
