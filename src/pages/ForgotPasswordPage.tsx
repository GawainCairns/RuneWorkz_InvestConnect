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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">InvestConnect</span>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Forgot your password?</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          {successMessage ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{successMessage}</p>
              <Link
                to="/login"
                className="inline-block mt-6 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-6">
          <Link to="/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Back to sign in
          </Link>
          <span className="text-gray-300">·</span>
          <Link to="/register" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
