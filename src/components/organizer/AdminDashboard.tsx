import { Calendar, ChevronDown, Mail, Plus, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import EventCard from './EventCard';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { events, loading: eventsLoading, fetchEvents, eventsFetched } = useEvents();
  const { invitees, fetchInvitees } = useInvitees();

  const [searchQuery, setSearchQuery] = useState('');
  const [showPastEvents, setShowPastEvents] = useState(false);

  useEffect(() => {
    if (!events.length && !eventsLoading && !eventsFetched) fetchEvents();
  }, [fetchEvents, events.length, eventsLoading, eventsFetched]);

  useEffect(() => {
    events.forEach(e => fetchInvitees(e.id));
  }, [events, fetchInvitees]);

  const now = new Date().toISOString().split('T')[0];

  const { upcoming, past } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? events.filter(e => e.title.toLowerCase().includes(q))
      : events;
    return {
      upcoming: filtered.filter(e => e.date >= now).sort((a, b) => a.date.localeCompare(b.date)),
      past: filtered.filter(e => e.date < now).sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [events, searchQuery, now]);

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
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <button
          onClick={() => navigate('/admin/events/new')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      {/* Quick Actions */}
      <h2 className="mb-3 text-xs font-semibold tracking-wide uppercase text-slate-500">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <div className="p-5 bg-white border shadow-sm rounded-xl border-slate-200">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Create Event', icon: <Plus className="w-4 h-4" />, path: '/admin/events/new', color: 'bg-brand-600 text-white hover:bg-brand-700' },
                { label: 'All Email Logs', icon: <Mail className="w-4 h-4" />, path: '/admin/emails', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { label: 'My Invitations', icon: <Users className="w-4 h-4" />, path: '/invitee-dashboard', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
              ].map(action => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${action.color}`}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events by name..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      <div className="space-y-8">
        {eventsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-4 rounded-full w-7 h-7 border-brand-600 border-t-transparent animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white border rounded-xl border-slate-200">
            <Calendar className="w-10 h-10 mb-3 text-slate-300" />
            <h3 className="mb-1 text-base font-semibold text-slate-900">No events yet</h3>
            <p className="mb-4 text-sm text-slate-500">Create your first event to get started.</p>
            <button
              onClick={() => navigate('/admin/events/new')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming Events */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold tracking-wide uppercase text-slate-500">
                  Upcoming Events {upcoming.length > 0 && `— ${upcoming.length}`}
                </h2>
              </div>
              {upcoming.length > 0 ? (
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
              ) : (
                <p className="py-6 text-sm text-slate-400">
                  {searchQuery ? 'No upcoming events match your search.' : 'No upcoming events.'}
                </p>
              )}
            </section>

            {/* Past Events */}
            <section>
              <button
                onClick={() => setShowPastEvents(prev => !prev)}
                className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-wide uppercase text-slate-500 transition-colors hover:text-slate-700"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${showPastEvents ? 'rotate-180' : ''}`}
                />
                Past Events {past.length > 0 && `— ${past.length}`}
                <span className="ml-1 text-slate-400 normal-case font-normal tracking-normal">
                  ({showPastEvents ? 'click to hide' : 'click to show'})
                </span>
              </button>

              {showPastEvents && (
                past.length > 0 ? (
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
                ) : (
                  <p className="py-6 text-sm text-slate-400">
                    {searchQuery ? 'No past events match your search.' : 'No past events.'}
                  </p>
                )
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
