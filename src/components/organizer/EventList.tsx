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
    if (!events.length && !loading) {
      fetchEvents().catch(() => {});
    }
  }, [fetchEvents, events.length, loading]);

  const now = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.date >= now);
  const past = events.filter(e => e.date < now);

  const getStats = (eventId: string) => {
    const evInvitees = invitees.filter(i => i.event_id === eventId);
    return {
      inviteeCount: evInvitees.length,
      confirmedCount: evInvitees.filter(i => i.rsvp_status === 'yes').length,
      paidCount: evInvitees.filter(i => i.payment_status === 'paid').length,
    };
  };

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events — {events.length}</h1>
        </div>
        <button
          onClick={() => navigate('/admin/events/new')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 rounded-full border-brand-600 border-t-transparent animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-100">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-900">No events yet</h3>
          <p className="max-w-sm mb-6 text-sm text-slate-500">
            Create your first event to start inviting guests and managing RSVPs.
          </p>
          <button
            onClick={() => navigate('/admin/events/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold tracking-wide uppercase text-slate-700">
                Upcoming — {upcoming.length}
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    {...getStats(event.id)}
                    showStats={true}
                    onClick={() => navigate(`/admin/events/${event.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold tracking-wide uppercase text-slate-700">
                Past — {past.length}
              </h2>
              <div className="grid grid-cols-1 gap-5 opacity-75 md:grid-cols-2 lg:grid-cols-3">
                {past.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    {...getStats(event.id)}
                    showStats={true}
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
