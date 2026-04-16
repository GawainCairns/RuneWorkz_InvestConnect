import { Calendar, Clock, DollarSign, MapPin, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import { formatEventDate, formatEventTime } from '../../utils/attendee';
import AttendeeLayout from './AttendeeLayout';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

export default function InvitationLanding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getInviteeByToken, updateInvitee, fetchInvitees } = useInvitees();
  const { getEvent, fetchEvents, events, loading: eventsLoading } = useEvents();

  const [detailsForm, setDetailsForm] = useState({ firstname: '', lastname: '', email: '' });
  const [detailsError, setDetailsError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!events.length && !eventsLoading) {
      fetchEvents().catch(() => {});
    }
  }, [fetchEvents, events.length, eventsLoading]);

  const invitee = token ? getInviteeByToken(token) : undefined;
  const event = invitee ? getEvent(invitee.event_id) : undefined;

  useEffect(() => {
    if (invitee) {
      fetchInvitees(invitee.event_id);
    }
  }, [invitee?.event_id, fetchInvitees]);

  useEffect(() => {
    if (invitee) {
      setDetailsForm({
        firstname: invitee.firstname || '',
        lastname: invitee.lastname || '',
        email: invitee.email || '',
      });
    }
  }, [invitee?.id]);

  const needsDetails = invitee && (!invitee.firstname || !invitee.email);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitee) return;
    if (!detailsForm.firstname.trim() || !detailsForm.lastname.trim()) {
      setDetailsError('First and last name are required.');
      return;
    }
    if (!detailsForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(detailsForm.email)) {
      setDetailsError('A valid email is required.');
      return;
    }
    setSubmitting(true);
    try {
      await updateInvitee(invitee.id, {
        firstname: detailsForm.firstname.trim(),
        lastname: detailsForm.lastname.trim(),
        email: detailsForm.email.trim(),
      });
      navigate(`/rsvp/${token}/respond`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceed = () => {
    navigate(`/rsvp/${token}/respond`);
  };

  if (!token) {
    return (
      <AttendeeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Invalid invitation link.</p>
        </div>
      </AttendeeLayout>
    );
  }

  if (!invitee || !event) {
    return (
      <AttendeeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">Loading your invitation...</p>
          </div>
        </div>
      </AttendeeLayout>
    );
  }

  return (
    <AttendeeLayout>
      <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-brand-200 mb-3">
            {event.brand}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{event.title}</h1>
          {event.description && (
            <p className="text-brand-100 text-base leading-relaxed max-w-lg mx-auto">{event.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="px-5 py-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-brand-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatEventDate(event.date)}</p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Time</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatEventTime(event.start_time)} – {formatEventTime(event.end_time)}
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Location</p>
                <p className="text-sm font-semibold text-slate-900">{event.location}</p>
              </div>
            </div>
          </div>

          {event.price > 0 && (
            <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-2 bg-emerald-50">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                Ticket price: ${event.price.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {needsDetails ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-semibold text-slate-900">Confirm your details</h2>
              </div>
              <form onSubmit={handleConfirm} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Jane"
                      value={detailsForm.firstname}
                      onChange={e => setDetailsForm(p => ({ ...p, firstname: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Smith"
                      value={detailsForm.lastname}
                      onChange={e => setDetailsForm(p => ({ ...p, lastname: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="jane@example.com"
                    value={detailsForm.email}
                    onChange={e => setDetailsForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                {detailsError && (
                  <p className="text-xs text-red-600">{detailsError}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Continue to RSVP →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-brand-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {invitee.firstname} {invitee.lastname}
                  </p>
                  <p className="text-xs text-slate-500">{invitee.email}</p>
                </div>
              </div>
              <button
                onClick={handleProceed}
                className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 transition-colors"
              >
                Continue to RSVP →
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4 pb-8">
          This invitation was sent to {invitee.email}. Please do not share this link.
        </p>
      </div>
    </AttendeeLayout>
  );
}
