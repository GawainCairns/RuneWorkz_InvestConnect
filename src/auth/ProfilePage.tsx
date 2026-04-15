import { Calendar, Mail, Shield, User } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-900 font-medium">{value || '—'}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) return null;

  const { user, roles } = profile;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your account details</p>
        </div>

        {/* Avatar / Name */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-4 flex items-center gap-5">
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.firstname} {user.lastname}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-500">{user.active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Mail className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Account Information</h3>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="First Name" value={user.firstname} />
            <Field label="Last Name" value={user.lastname} />
            <Field label="Email" value={user.email} />
            <Field label="Username" value={user.username} />
          </div>
        </div>

        {/* Dates */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <Calendar className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Member Since" value={formatDate(user.date_created)} />
            <Field label="Account Status" value={user.active ? 'Active' : 'Inactive'} />
          </div>
        </div>

        {/* Roles */}
        {roles.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <Shield className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Roles & Permissions</h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {roles.map(role => (
                <div key={role.id} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                    )}
                    {role.permissions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {role.permissions.map(perm => (
                          <span
                            key={perm.id}
                            className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {perm.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
