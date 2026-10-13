import React, { useState } from 'react';
import { loginWithEmail, loginWithGoogle } from '../firebase';

interface LoginViewProps {
  onSuccess: (user: any) => void;
  onNavigateToSignup: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onNavigateToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithEmail(email, password);
      onSuccess({
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Sales Agent',
        email: user.email,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password. Please check your credentials or create a new account.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please wait a moment and try again.';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithGoogle();
      onSuccess({
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Sales Agent',
        email: user.email,
      });
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err.message || 'Google sign-in was cancelled or encountered an error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page py-12 px-4">
      <div className="container max-w-md mx-auto">
        <section className="form-card bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
              ⚡
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Agent Login</h1>
            <p className="text-sm text-gray-500 mt-1">
              Securely access solar leads, site survey bookings, and customer CRM.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          {/* Quick 1-Click Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700 mb-5 shadow-xs cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.09C3.26 21.41 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.41l4.04-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.59l4.04 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-xs text-gray-400 font-medium">Or email sign in</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form data-login-form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-sm text-gray-800 transition"
                id="email"
                type="email"
                placeholder="agent@solarsolutions.pk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1" htmlFor="password">
                Password
              </label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-sm text-gray-800 transition"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Authenticating with Database...
                  </>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>

              <button
                type="button"
                className="w-full py-2 px-4 text-xs font-medium text-gray-600 hover:text-teal-700 hover:bg-teal-50/50 rounded-lg transition"
                onClick={onNavigateToSignup}
              >
                Don't have an account? Create Sales Account
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};
