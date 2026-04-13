import { Calendar, Clock, MapPin, Plus, Users } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

const upcomingEvents = [
  {
    id: 1,
    title: 'Q2 Investor Briefing',
    date: 'Apr 18, 2026',
    time: '2:00 PM',
    location: 'Grand Ballroom, Marriott',
    guests: 48,
    status: 'Confirmed',
  },
  {
    id: 2,
    title: 'Annual Stakeholder Dinner',
    date: 'Apr 25, 2026',
    time: '7:00 PM',
    location: 'The Capital Grille',
    guests: 22,
    status: 'Pending RSVPs',
  },
  {
    id: 3,
    title: 'Portfolio Review Workshop',
    date: 'May 3, 2026',
    time: '10:00 AM',
    location: 'Conference Room A',
    guests: 15,
    status: 'Draft',
  },
];

const statusColors: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  'Pending RSVPs': 'bg-accent-100 text-accent-700',
  Draft: 'bg-gray-100 text-gray-600',
};

export default function HomePage() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back, {profile?.user.firstname}
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">Here's what's happening with your events.</p>
          </div>
          <button className="inline-flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Events', value: '12', icon: Calendar, color: 'bg-brand-50 text-brand-600' },
            { label: 'Upcoming', value: '3', icon: Clock, color: 'bg-accent-50 text-accent-600' },
            { label: 'Total Guests', value: '248', icon: Users, color: 'bg-green-50 text-green-600' },
            { label: 'Confirmed RSVPs', value: '186', icon: Users, color: 'bg-blue-50 text-blue-600' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Events List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Upcoming Events</h2>
            <button className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
              View all
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className="px-6 py-5 hover:bg-gray-50/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
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
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No upcoming events</p>
              <button className="mt-3 text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors">
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
