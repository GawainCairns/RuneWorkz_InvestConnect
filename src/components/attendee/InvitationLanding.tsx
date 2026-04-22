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
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-500">Invalid invitation link.</p>
        </div>
      </AttendeeLayout>
    );
  }

  if (!invitee || !event) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-4 rounded-full border-brand-600 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-500">Loading your invitation...</p>
          </div>
        </div>
      </AttendeeLayout>
    );
  }

  return (
    <AttendeeLayout>
      <div className="px-4 py-16 text-white bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block mb-3 text-xs font-semibold tracking-widest uppercase text-brand-200">
            {event.brand}
          </span>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl">{event.title}</h1>
          {event.description && (
            <p className="max-w-lg mx-auto text-base leading-relaxed text-brand-100">{event.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl px-4 mx-auto -mt-6">
        <div className="overflow-hidden bg-white border shadow-lg rounded-xl border-slate-200">
          <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="flex items-center gap-3 px-5 py-4">
              <Calendar className="w-5 h-5 text-brand-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatEventDate(event.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <Clock className="w-5 h-5 text-brand-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Time</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatEventTime(event.start_time)} – {formatEventTime(event.end_time)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Location</p>
                <p className="text-sm font-semibold text-slate-900">{event.location}</p>
              </div>
            </div>
          </div>

          {event.price > 0 && (
            <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-100 bg-emerald-50">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                Ticket price: ${event.price.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 mt-6 bg-white border shadow-sm rounded-xl border-slate-200">
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
                  className="w-full py-3 font-semibold text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Continue to RSVP →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-100 shrink-0">
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
                className="w-full py-3 font-semibold text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700"
              >
                Continue to RSVP →
              </button>
            </>
          )}
        </div>

        <p className="pb-8 mt-4 text-xs text-center text-slate-400">
          This invitation was sent to {invitee.email}. Please do not share this link.
        </p>
      </div>
    </AttendeeLayout>
  );
}
