import { Calendar, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import EventCard from './EventCard';

export default function EventList() {
  const navigate = useNavigate();
  const { events, loading, fetchEvents } = useEvents();
  const { invitees } = useInvitees();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const now = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.date >= now);
  const past = events.filter(e => e.date < now);

  const getStats = (eventId: string) => {
    const evInvitees = invitees.filter(i => i.event_id === eventId);
    return {
      inviteeCount: evInvitees.length,
      confirmedCount: evInvitees.filter(i => i.rsvp_status === 'confirmed').length,
      paidCount: evInvitees.filter(i => i.payment_status === 'paid').length,
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-500 mt-1 text-sm">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => navigate('/admin/events/new')}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No events yet</h3>
          <p className="text-slate-500 text-sm max-w-sm mb-6">
            Create your first event to start inviting guests and managing RSVPs.
          </p>
          <button
            onClick={() => navigate('/admin/events/new')}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-slate-700 mb-4 uppercase tracking-wide text-xs">
                Upcoming — {upcoming.length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcoming.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    {...getStats(event.id)}
                    onClick={() => navigate(`/admin/events/${event.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-slate-700 mb-4 uppercase tracking-wide text-xs">
                Past — {past.length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 opacity-75">
                {past.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    {...getStats(event.id)}
                    onClick={() => navigate(`/admin/events/${event.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
