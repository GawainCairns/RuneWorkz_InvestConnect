import {
  Calendar,
  CalendarPlus,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import { buildGoogleCalendarUrl, formatEventDate, formatEventTime } from '../../utils/attendee';
import AttendeeLayout from './AttendeeLayout';

export default function ConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const { getInviteeByToken, updateInvitee } = useInvitees();
  const { getEvent } = useEvents();
  const { logEmail } = useEmailLogs();
  const persistedRef = useRef(false);
  const emailedRef = useRef(false);

  const invitee = token ? getInviteeByToken(token) : undefined;
  const event = invitee ? getEvent(invitee.event_id) : undefined;

  useEffect(() => {
    if (!invitee || !event || persistedRef.current) return;
    const key = `rsvp_persisted_${invitee.id}`;
    if (localStorage.getItem(key)) return;
    persistedRef.current = true;
    localStorage.setItem(key, '1');
    updateInvitee(invitee.id, {
      rsvp_status: invitee.rsvp_status,
      dietary: invitee.dietary,
    });
  }, [invitee?.id]);

  useEffect(() => {
    if (!invitee || !event || emailedRef.current) return;
    const key = `rsvp_emailed_${invitee.id}`;
    if (localStorage.getItem(key)) return;
    emailedRef.current = true;
    localStorage.setItem(key, '1');

    const isConfirmed = invitee.rsvp_status === 'confirmed';
    logEmail({
      event_id: event.id,
      invitee_id: invitee.id,
      to_email: invitee.email,
      subject: isConfirmed
        ? `Your RSVP is confirmed — ${event.title}`
        : `RSVP received — ${event.title}`,
      body: isConfirmed
        ? `<p>Hi ${invitee.firstname},</p><p>Your attendance at <strong>${event.title}</strong> on ${formatEventDate(event.date)} has been confirmed. We look forward to seeing you!</p><p><strong>Location:</strong> ${event.location}</p>`
        : `<p>Hi ${invitee.firstname},</p><p>We've noted that you won't be able to attend <strong>${event.title}</strong>. Thank you for letting us know.</p>`,
      type: 'rsvp',
    });
  }, [invitee?.id]);

  if (!invitee || !event) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-500">Invitation not found.</p>
        </div>
      </AttendeeLayout>
    );
  }

  const isConfirmed = invitee.rsvp_status === 'confirmed';
  const calendarUrl = buildGoogleCalendarUrl(event);

  const paymentStatusDisplay = () => {
    if (invitee.payment_status === 'paid') {
      return { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' };
    }
    if (invitee.payment_status === 'invoice-issued') {
      return { label: 'Invoice Sent', color: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Pending', color: 'bg-slate-100 text-slate-600' };
  };

  const payStatus = paymentStatusDisplay();

  return (
    <AttendeeLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-2 text-center">
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Step 4 of 4</span>
          </div>
          <div className="w-full h-1 mb-8 overflow-hidden rounded-full bg-slate-200">
            <div className="w-full h-1 rounded-full bg-brand-600" />
          </div>

          <div className="p-8 bg-white border shadow-lg rounded-xl border-slate-200">
            <div className="mb-6 text-center">
              {isConfirmed ? (
                <CheckCircle className="mx-auto mb-3 w-14 h-14 text-emerald-500" />
              ) : (
                <XCircle className="mx-auto mb-3 w-14 h-14 text-slate-400" />
              )}
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${
                  isConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isConfirmed ? 'Attendance Confirmed' : 'Unable to Attend'}
              </span>
              <h1 className="mb-1 text-xl font-bold text-slate-900">
                {isConfirmed ? "You're all set!" : 'Thanks for letting us know'}
              </h1>
              <p className="text-sm text-slate-500">
                {isConfirmed
                  ? `A confirmation has been sent to ${invitee.email}.`
                  : `We've noted your response for ${event.title}.`}
              </p>
            </div>

            <div className="p-4 mb-5 space-y-3 border bg-slate-50 rounded-xl border-slate-200">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Date</p>
                  <p className="text-sm font-semibold text-slate-900">{formatEventDate(event.date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatEventTime(event.start_time)} – {formatEventTime(event.end_time)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm font-semibold text-slate-900">{event.location}</p>
                </div>
              </div>
            </div>

            {isConfirmed && event.price > 0 && (
              <div className="flex items-center justify-between px-4 py-3 mb-5 bg-white border rounded-lg border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-700">Payment</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${payStatus.color}`}>
                  {payStatus.label}
                </span>
              </div>
            )}

            {invitee.invoice && (
              <div className="px-4 py-3 mb-5 text-sm border rounded-lg bg-amber-50 border-amber-200">
                <p className="mb-1 font-semibold text-amber-800">Invoice {invitee.invoice.number}</p>
                <p className="text-xs text-amber-700">
                  Sent to {invitee.invoice.contact_email} · ${invitee.invoice.amount.toFixed(2)}
                </p>
              </div>
            )}

            {isConfirmed && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700"
              >
                <CalendarPlus className="w-5 h-5" />
                Add to Calendar
              </a>
            )}
          </div>

          <p className="mt-6 text-xs text-center text-slate-400">
            Questions? Contact the event organizer.
          </p>
        </div>
      </div>
    </AttendeeLayout>
  );
}
