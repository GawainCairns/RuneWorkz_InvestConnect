import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

function hasAdminRole(profile: any) {
  if (!profile) return false;
  const roles = profile.roles || [];
  for (const r of roles) {
    if (!r) continue;
    const name = (r.name || '').toString().toLowerCase();
    if (name === 'admin') return true;
    const perms = r.permissions || [];
    if (perms.some((p: any) => (p.name || '').toString().toLowerCase() === 'admin' && Number(p.value) === 1)) return true;
  }
  return false;
}

export default function AdminRoute({ children }: Props) {
  const { token, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  if (!hasAdminRole(profile)) return <Navigate to="/home" replace />;

  return <>{children}</>;
}
