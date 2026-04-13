import { Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register, token } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) navigate('/home', { replace: true });
  }, [token, navigate]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        username: form.username || form.email,
        firstname: form.firstname,
        lastname: form.lastname,
        avatar: null,
        active: 1,
      });
      navigate('/home', { replace: true });
    } catch (err) {
      showAlert(err instanceof Error ? err.message : 'Registration failed', 'error');
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
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1 text-sm">Start managing events today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1.5">
                  First name
                </label>
                <input
                  id="firstname"
                  type="text"
                  value={form.firstname}
                  onChange={update('firstname')}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last name
                </label>
                <input
                  id="lastname"
                  type="text"
                  value={form.lastname}
                  onChange={update('lastname')}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={update('username')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                placeholder="johndoe (optional)"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update('email')}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={update('password')}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 pr-11 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
              Sign in
            </Link>
          </p>
          <p className="text-center text-sm mt-3">
            <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-brand-600 transition-colors">
              Forgot your password?
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:text-gray-600 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
