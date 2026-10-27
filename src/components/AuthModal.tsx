import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveFirebaseConfig, getFirebaseConfig, clearFirebaseConfig, isFirebaseConfigured } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    userName,
    updateUserName,
    signUp,
    signIn,
    logOut,
    sendReset,
    resendVerification,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'config'>(user ? 'signin' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(userName);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Custom Firebase Config form
  const existingConfig = getFirebaseConfig();
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(existingConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(existingConfig?.projectId || '');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      setInfoMsg('Successfully signed in. Syncing your data...');
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await signUp(email, password, name);
      setInfoMsg('Account created! A verification link was sent to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserName(name);
    setInfoMsg('Name updated.');
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      setErrorMsg('Please enter both API Key and Project ID.');
      return;
    }
    saveFirebaseConfig({
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
    });
  };

  const isConfigured = isFirebaseConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]">
      <div
        className="w-full max-w-md bg-canvas border border-border-subtle p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="flex items-center justify-between pb-4 hairline-b mb-5">
          <div>
            <h3 id="auth-modal-title" className="font-serif text-2xl font-normal text-primary">
              {user ? 'Account & Profile' : 'Cross-Device Sync'}
            </h3>
            <p className="text-xs text-secondary mt-0.5 font-sans">
              {user ? user.email : 'Sign in to access your habits on phone & PC'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-tertiary hover:text-primary transition-colors cursor-pointer p-1"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab switchers if not logged in */}
        {!user && (
          <div className="flex gap-4 text-xs font-mono hairline-b pb-3 mb-5">
            <button
              onClick={() => {
                setActiveTab('signin');
                setErrorMsg(null);
              }}
              className={`pb-1 cursor-pointer transition-colors ${
                activeTab === 'signin'
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-tertiary hover:text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab('signup');
                setErrorMsg(null);
              }}
              className={`pb-1 cursor-pointer transition-colors ${
                activeTab === 'signup'
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-tertiary hover:text-primary'
              }`}
            >
              Create Account
            </button>
            <button
              onClick={() => {
                setActiveTab('config');
                setErrorMsg(null);
              }}
              className={`pb-1 cursor-pointer transition-colors ${
                activeTab === 'config'
                  ? 'border-b-2 border-primary text-primary font-medium'
                  : 'text-tertiary hover:text-primary'
              }`}
            >
              Firebase Config
            </button>
          </div>
        )}

        {/* User Logged In Profile */}
        {user ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1">
                Display Name
              </label>
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="flex-1 bg-surface border border-border-subtle px-3 py-1.5 text-sm text-primary font-sans focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-mono border border-border-subtle hover:border-primary text-primary cursor-pointer"
                >
                  Save
                </button>
              </form>
            </div>

            <div className="p-3 bg-surface border border-border-subtle text-xs font-mono space-y-1.5">
              <div className="flex justify-between items-center text-secondary">
                <span>Account Email:</span>
                <span className="text-primary font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between items-center text-secondary">
                <span>Email Status:</span>
                <span className={user.emailVerified ? 'text-complete font-medium' : 'text-danger font-medium'}>
                  {user.emailVerified ? '✓ Verified' : 'Unverified'}
                </span>
              </div>
              {!user.emailVerified && (
                <div className="pt-2 hairline-t flex justify-between items-center">
                  <span className="text-tertiary text-[11px]">Need another verification link?</span>
                  <button
                    onClick={async () => {
                      await resendVerification();
                      setInfoMsg('Verification email resent.');
                    }}
                    className="text-xs text-primary underline cursor-pointer"
                  >
                    Resend
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 hairline-t flex justify-between items-center">
              <button
                onClick={logOut}
                className="text-xs font-mono text-danger hover:underline cursor-pointer"
              >
                Sign Out
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-mono bg-primary text-canvas border border-primary hover:opacity-90 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : activeTab === 'signin' ? (
          /* Sign In Form */
          <form onSubmit={handleSignIn} className="space-y-4">
            {!isConfigured && (
              <div className="p-3 bg-surface border border-border-subtle text-xs text-secondary leading-relaxed mb-3">
                <span className="font-semibold text-primary">Note:</span> To sync across devices via Firebase, configure your Firebase keys under the{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className="text-primary underline font-mono"
                >
                  Firebase Config
                </button>{' '}
                tab.
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-surface border border-border-subtle px-3 py-2 text-sm text-primary font-sans focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-secondary">
                  Password
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setErrorMsg('Please enter your email above to reset password.');
                      return;
                    }
                    try {
                      await sendReset(email);
                      setInfoMsg(`Password reset email sent to ${email}.`);
                    } catch (e: any) {
                      setErrorMsg(e.message || 'Failed to send reset email.');
                    }
                  }}
                  className="text-[11px] font-mono text-tertiary hover:text-primary underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-border-subtle px-3 py-2 text-sm text-primary font-sans focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-3 hairline-t flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-secondary hover:text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 text-xs font-mono bg-primary text-canvas border border-primary hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : activeTab === 'signup' ? (
          /* Sign Up Form */
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Naksh"
                className="w-full bg-surface border border-border-subtle px-3 py-2 text-sm text-primary font-sans focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-surface border border-border-subtle px-3 py-2 text-sm text-primary font-sans focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-secondary mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-surface border border-border-subtle px-3 py-2 text-sm text-primary font-sans focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-3 hairline-t flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-secondary hover:text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 text-xs font-mono bg-primary text-canvas border border-primary hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        ) : (
          /* Firebase Setup Form */
          <form onSubmit={handleSaveFirebaseConfig} className="space-y-4 text-xs">
            <p className="text-secondary leading-relaxed">
              To connect your own Firebase project for free cloud sync across mobile and PC, provide your Firebase Web app credentials below (from Firebase Console &gt; Project Settings &gt; General &gt; Your apps):
            </p>

            <div>
              <label className="block font-mono uppercase tracking-wider text-secondary mb-1">
                API Key (apiKey)
              </label>
              <input
                type="text"
                required
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-surface border border-border-subtle px-3 py-1.5 font-mono text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-mono uppercase tracking-wider text-secondary mb-1">
                Project ID (projectId)
              </label>
              <input
                type="text"
                required
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                placeholder="my-habit-studio"
                className="w-full bg-surface border border-border-subtle px-3 py-1.5 font-mono text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block font-mono uppercase tracking-wider text-secondary mb-1">
                Auth Domain (optional)
              </label>
              <input
                type="text"
                value={authDomain}
                onChange={e => setAuthDomain(e.target.value)}
                placeholder="my-habit-studio.firebaseapp.com"
                className="w-full bg-surface border border-border-subtle px-3 py-1.5 font-mono text-primary focus:outline-none focus:border-primary"
              />
            </div>

            <div className="pt-3 hairline-t flex justify-between items-center">
              {existingConfig && (
                <button
                  type="button"
                  onClick={clearFirebaseConfig}
                  className="text-danger underline font-mono text-xs cursor-pointer"
                >
                  Reset Config
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 font-mono text-secondary hover:text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-mono bg-primary text-canvas border border-primary hover:opacity-90 cursor-pointer"
                >
                  Save & Reload
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Message Feedback */}
        {errorMsg && (
          <div className="mt-4 p-2.5 text-xs font-mono border border-danger/30 text-danger bg-danger/5">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="mt-4 p-2.5 text-xs font-mono border border-complete/30 text-complete bg-complete-tint/40">
            {infoMsg}
          </div>
        )}
      </div>
    </div>
  );
};
