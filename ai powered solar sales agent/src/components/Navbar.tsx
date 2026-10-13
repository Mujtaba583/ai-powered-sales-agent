import React, { useState } from 'react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user?: { id: string; name: string; email: string } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="site-header">
      <div className="container-wide navbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          aria-label="AI Sales Agent home"
        >
          <span className="brand-mark">
            <img src="/assets/logo-icon.png" alt="AI Sales Agent logo" />
          </span>
          <span className="brand-copy">
            <span className="brand-title">AI Sales Agent</span>
            <span className="brand-tagline"></span>
          </span>
        </a>

        <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`} aria-label="Main navigation">
          <a
            href="#"
            className={currentTab === 'home' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('home');
            }}
          >
            Home
          </a>
          <a
            href="#"
            className={currentTab === 'assistant' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('assistant');
            }}
          >
            Voice Assistant
          </a>
          <a
            href="#"
            className={currentTab === 'products' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('products');
            }}
          >
            Products
          </a>
          <a
            href="#"
            className={currentTab === 'dashboard' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('dashboard');
            }}
          >
            Dashboard
          </a>
        </nav>

        <div className={`nav-actions ${mobileMenuOpen ? 'open' : ''}`}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 750,
                  color: 'var(--primary-700)',
                  background: 'var(--primary-50)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: '1px solid #cfeceb',
                }}
              >
                {user.name}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ color: '#b42318' }}
                onClick={onLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <a
                href="#"
                className={`btn btn-ghost ${currentTab === 'login' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('login');
                }}
              >
                Login
              </a>
              <a
                href="#"
                className={`btn btn-primary ${currentTab === 'signup' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('signup');
                }}
              >
                Sign Up
              </a>
            </>
          )}
        </div>

        <button
          className="nav-toggle"
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
        </button>
      </div>
    </header>
  );
};
