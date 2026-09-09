import { CheckCircle, Mail, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AUTH_API_BASE, TENANT_ID } from '../config/constants';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`${AUTH_API_BASE}/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-id': TENANT_ID,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Something went wrong');
      }

      setSuccessMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-brand-600 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">InvestConnect</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Forgot your password?</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl shadow-gray-100">
          {successMessage ? (
            <div className="py-4 text-center">
              <div className="flex items-center justify-center mx-auto mb-4 w-14 h-14 bg-green-50 rounded-2xl">
                <CheckCircle className="text-green-500 w-7 h-7" />
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{successMessage}</p>
              <button type="button" onClick={() => window.history.back()} className="inline-block mt-6 text-sm font-medium transition-colors text-brand-600 hover:text-brand-700">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="px-4 py-3 text-sm text-red-700 border border-red-100 rounded-lg bg-red-50">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                )}
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <button type="button" onClick={() => window.history.back()} className="text-xs text-gray-400 transition-colors hover:text-gray-600">
            Back to sign in
          </button>
          <span className="text-gray-300">·</span>
          <Link to="/register" className="text-xs text-gray-400 transition-colors hover:text-gray-600">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
