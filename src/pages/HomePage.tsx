import { Calendar, Clock, MapPin, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import { useInvitees } from '../contexts/InviteeContext';

// Remove hardcoded demo events so the dashboard shows real data (or empty state).
const upcomingEvents: any[] = [];

const statusColors: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  'Pending RSVPs': 'bg-accent-100 text-accent-700',
  Draft: 'bg-gray-100 text-gray-600',
};

export default function HomePage() {
  const { profile } = useAuth();
  const { events, fetchEvents } = useEvents();
  const { invitees, fetchInvitees } = useInvitees();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    events.forEach((e: any) => fetchInvitees(e.id));
  }, [events, fetchInvitees]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 w-full px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {profile?.user.firstname}
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">Here's what's happening with your events.</p>
          </div>
          <button onClick={() => navigate('/admin/events/new')} className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>

        {/* Stats (live) */}
        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
          {(() => {
            const now = new Date().toISOString().split('T')[0];
            const totalEvents = events.length;
            const upcomingCount = events.filter(e => e.date >= now).length;
            const totalGuests = invitees.length;
            const confirmed = invitees.filter(i => i.rsvp_status === 'confirmed').length;

            const stats = [
              { label: 'Total Events', value: totalEvents, icon: Calendar, color: 'bg-brand-50 text-brand-600' },
              { label: 'Upcoming', value: upcomingCount, icon: Clock, color: 'bg-accent-50 text-accent-600' },
              { label: 'Total Guests', value: totalGuests, icon: Users, color: 'bg-green-50 text-green-600' },
              { label: 'Confirmed RSVPs', value: confirmed, icon: Users, color: 'bg-blue-50 text-blue-600' },
            ];

            return stats.map(stat => {
              const Icon = stat.icon as any;
              return (
                <div key={stat.label} className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-xl">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Events List */}
        <div className="overflow-hidden bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Upcoming Events</h2>
            <button onClick={() => navigate('/admin/events')} className="text-sm font-medium transition-colors text-brand-600 hover:text-brand-700">
              View all
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="px-6 py-5 transition-colors cursor-pointer hover:bg-gray-50/50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg bg-brand-50">
                      <Calendar className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <div className="flex flex-wrap items-center mt-1 gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {event.date} at {event.time}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {event.guests} guests
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full self-start sm:self-auto flex-shrink-0 ${statusColors[event.status]}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {upcomingEvents.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No upcoming events</p>
              <button onClick={() => navigate('/admin/events/new')} className="mt-3 text-sm font-medium transition-colors text-brand-600 hover:text-brand-700">
                Create your first event
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
