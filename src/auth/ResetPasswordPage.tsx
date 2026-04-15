import { AlertCircle, CheckCircle, Eye, EyeOff, KeyRound, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_API_BASE, TENANT_ID } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { AuthProfile } from '../contexts/AuthContext';

type PageState = 'loading' | 'invalid' | 'used' | 'form' | 'success';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { applyAuth } = useAuth();

  const code = searchParams.get('code') ?? '';

  const [pageState, setPageState] = useState<PageState>('loading');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!code) {
      setPageState('invalid');
      return;
    }

    const checkCode = async () => {
      try {
        const res = await fetch(`${AUTH_API_BASE}/forgot?code=${encodeURIComponent(code)}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-id': TENANT_ID,
          },
        });

        if (!res.ok) {
          setPageState('invalid');
          return;
        }

        const data = await res.json();

        if (data.used === 1 || data.used === '1' || data.used === true) {
          setPageState('used');
        } else {
          setPageState('form');
        }
      } catch {
        setPageState('invalid');
      }
    };

    checkCode();
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${AUTH_API_BASE}/forgot/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-id': TENANT_ID,
        },
        body: JSON.stringify({ forcekey: code, new_password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Reset failed');
      }

      applyAuth(data.token, data.profile as AuthProfile);
      setPageState('success');

      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">InvestConnect</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Reset your password</h1>
          <p className="text-gray-500 mt-1 text-sm">Choose a new password for your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          {pageState === 'loading' && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Validating your reset link...</p>
            </div>
          )}

          {pageState === 'invalid' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Invalid reset link</h2>
              <p className="text-sm text-gray-500 mb-6">
                This password reset link is invalid or has expired.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Request a new reset link
              </Link>
            </div>
          )}

          {pageState === 'used' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-7 h-7 text-amber-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Link already used</h2>
              <p className="text-sm text-gray-500 mb-6">
                This password reset link has already been used. Each link can only be used once.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Request a new reset link
              </Link>
            </div>
          )}

          {pageState === 'success' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Password updated</h2>
              <p className="text-sm text-gray-500">
                Your password has been reset successfully. Redirecting you to your dashboard...
              </p>
            </div>
          )}

          {pageState === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {submitting ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        {(pageState === 'form' || pageState === 'invalid' || pageState === 'used') && (
          <p className="text-center text-xs text-gray-400 mt-6">
            <Link to="/login" className="hover:text-gray-600 transition-colors">← Back to sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
