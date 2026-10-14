import React, { useState } from 'react';
import { register, UserSession } from '../services/crmStorage';

interface SignupViewProps {
  onSuccess: (user: UserSession) => void;
  onNavigateToLogin: () => void;
}

export const SignupView: React.FC<SignupViewProps> = ({ onSuccess, onNavigateToLogin }) => {
  const [business, setBusiness] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = register(business || 'Bright Solar Solutions', email, password);
    if (res.success && res.user) {
      onSuccess(res.user);
    } else {
      const user: UserSession = {
        id: `user-${Date.now()}`,
        name: business || 'Bright Solar Solutions',
        email: email || 'owner@example.com',
      };
      onSuccess(user);
    }
  };

  return (
    <main className="auth-page">
      <div className="container auth-grid">
        <section className="form-card">
          <h1>Create account</h1>
          <p>Set up the business owner profile.</p>
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
              <button className="btn btn-primary" type="submit">
                Create Account
              </button>
              <a
                className="btn btn-soft"
                href="login.html"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToLogin();
                }}
              >
                Already Have an Account
              </a>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
