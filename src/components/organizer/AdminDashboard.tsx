import { Calendar, CheckCircle, DollarSign, Mail, Plus, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import EventCard from './EventCard';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="p-5 bg-white border shadow-sm rounded-xl border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { events, loading: eventsLoading, fetchEvents } = useEvents();
  const { invitees, fetchInvitees } = useInvitees();
  const { emailLogs, fetchEmailLogs } = useEmailLogs();

  useEffect(() => {
    if (!events.length && !eventsLoading) fetchEvents();
  }, [fetchEvents, events.length, eventsLoading]);

  useEffect(() => {
    events.forEach(e => fetchInvitees(e.id));
  }, [events, fetchInvitees]);

  useEffect(() => {
    fetchEmailLogs();
  }, [fetchEmailLogs]);

  const now = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => e.date >= now).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter(e => e.date < now).sort((a, b) => b.date.localeCompare(a.date));

  const totalInvitees = invitees.length;
  const totalConfirmed = invitees.filter(i => i.rsvp_status === 'yes').length;
  const totalPaid = invitees.filter(i => i.payment_status === 'paid').length;

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
          <p className="mt-1 text-sm text-slate-500">Overview of your events and guests</p>
        </div>
        <button
          onClick={() => navigate('/admin/events/new')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg shadow-sm bg-brand-600 hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-brand-600" />}
          label="Total Events"
          value={events.length}
          color="bg-brand-50"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-slate-600" />}
          label="Total Invitees"
          value={totalInvitees}
          color="bg-slate-100"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          label="Confirmed"
          value={totalConfirmed}
          color="bg-emerald-50"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-amber-600" />}
          label="Paid"
          value={totalPaid}
          color="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="border-4 rounded-full w-7 h-7 border-brand-600 border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-semibold tracking-wide uppercase text-slate-500">
                    Upcoming Events
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {upcoming.slice(0, 4).map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        {...getStats(event.id)}
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                      />
                    ))}
                  </div>
                  {upcoming.length > 4 && (
                    <button
                      onClick={() => navigate('/admin/events')}
                      className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      View all {upcoming.length} upcoming events →
                    </button>
                  )}
                </section>
              )}

              {past.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-semibold tracking-wide uppercase text-slate-500">
                    Past Events
                  </h2>
                  <div className="grid grid-cols-1 gap-4 opacity-75 sm:grid-cols-2">
                    {past.slice(0, 2).map(event => (
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

              {events.length === 0 && (
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
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-5 bg-white border shadow-sm rounded-xl border-slate-200">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Create Event', icon: <Plus className="w-4 h-4" />, path: '/admin/events/new', color: 'bg-brand-600 text-white hover:bg-brand-700' },
                { label: 'View All Events', icon: <Calendar className="w-4 h-4" />, path: '/admin/events', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { label: 'All Email Logs', icon: <Mail className="w-4 h-4" />, path: '/admin/emails', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
                { label: 'My Invitations', icon: <Users className="w-4 h-4" />, path: '/admin/invitee-dashboard', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
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

          <div className="p-5 bg-white border shadow-sm rounded-xl border-slate-200">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Email Activity</h3>
            <div className="mb-1 text-3xl font-bold text-slate-900">{emailLogs.length}</div>
            <p className="text-sm text-slate-500">emails sent across all events</p>
          </div>
        </div>
      </div>
    </div>
  );
}
