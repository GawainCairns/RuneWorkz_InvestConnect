import { Calendar, CheckCircle, Clock, ExternalLink, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function InviteeDashboard() {
  const { profile } = useAuth();
  const { events } = useEvents();
  const { invitees } = useInvitees();

  const userEmail = profile?.user.email ?? '';
  const myInvites = invitees.filter(i => i.email === userEmail);

  const myEvents = myInvites.map(invite => {
    const event = events.find(e => e.id === invite.event_id);
    return event ? { event, invite } : null;
  }).filter(Boolean) as { event: (typeof events)[number]; invite: (typeof invitees)[number] }[];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Invitations</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Events you've been invited to, linked to <strong>{userEmail}</strong>.
        </p>
      </div>

      {myEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No invitations yet</h3>
          <p className="text-slate-500 text-sm max-w-sm">
            When someone invites you to an event, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {myEvents.map(({ event, invite }) => (
            <div key={invite.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <span className="inline-block text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full mb-2">
                    {event.brand}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {formatTime(event.start_time)} – {formatTime(event.end_time)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invite.rsvp_status === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : invite.rsvp_status === 'declined'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {invite.rsvp_status === 'confirmed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {invite.rsvp_status.charAt(0).toUpperCase() + invite.rsvp_status.slice(1)}
                  </span>
                  <a
                    href={`/rsvp/${invite.invite_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    RSVP
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
