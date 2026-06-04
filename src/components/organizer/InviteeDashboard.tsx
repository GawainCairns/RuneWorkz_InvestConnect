import { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Clock, ExternalLink, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { inviteeService } from '../../services/inviteeService';
import type { InviteeByEmailEntry } from '../../types/api';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
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
  const userEmail = profile?.user.email ?? '';

  const [myEvents, setMyEvents] = useState<InviteeByEmailEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(userEmail));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    setLoading(true);
    setError(null);
    inviteeService
      .getByEmail(userEmail)
      .then(res => setMyEvents(res.events))
      .catch(() => setError('Failed to load your invitations.'))
      .finally(() => setLoading(false));
  }, [userEmail]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Invitations</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Events you've been invited to, linked to <strong>{userEmail || 'your email'}</strong>.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-red-600 py-24">{error}</p>
      ) : myEvents.length === 0 ? (
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
          {myEvents.map(({ event, invitee }) => (
            <div key={invitee.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
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
                      {formatTime(event.startTime)} – {formatTime(event.endTime)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invitee.rsvpStatus === 'confirmed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : invitee.rsvpStatus === 'declined'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {invitee.rsvpStatus === 'confirmed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {invitee.rsvpStatus.charAt(0).toUpperCase() + invitee.rsvpStatus.slice(1)}
                  </span>
                  <a
                    href={`/rsvp/${invitee.inviteCode}`}
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
