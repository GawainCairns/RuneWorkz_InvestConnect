import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarPlus,
  CheckCircle,
  Clock,
  MapPin,
  Utensils,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import { inviteeService } from '../../services/inviteeService';
import type { Invitee } from '../../types/organizer';
import { buildGoogleCalendarUrl, formatEventDate, formatEventTime } from '../../utils/attendee';
import AttendeeLayout from './AttendeeLayout';

export default function ConfirmationPage() {
  const { token: paramToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // status defaults to 'success' when navigating from non-payment flows (RSVP no / free event)
  const status = (searchParams.get('status') as 'success' | 'cancel' | 'failure') ?? 'success';

  // Recover token from sessionStorage when redirected from payment gateway
  const token = paramToken ?? (sessionStorage.getItem('payment_token') ?? undefined);

  const { getInviteeByToken, updateInviteeLocal } = useInvitees();
  const { getEvent } = useEvents();
  const { logEmail } = useEmailLogs();

  const contextInvitee = token ? getInviteeByToken(token) : undefined;
  const [invitee, setInvitee] = useState<Invitee | undefined>(contextInvitee);
  const event = invitee ? getEvent(invitee.event_id) : undefined;

  const persistedRef = useRef(false);
  const emailedRef = useRef(false);

  // Clear sessionStorage payment token on payment gateway redirect
  useEffect(() => {
    if (!paramToken && sessionStorage.getItem('payment_token')) {
      sessionStorage.removeItem('payment_token');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist RSVP + dietary to the database (once), then fetch the latest invitee record
  useEffect(() => {
    if (!contextInvitee || persistedRef.current) return;
    persistedRef.current = true;

    const persistKey = `rsvp_persisted_${contextInvitee.id}`;
    const persistPromise = localStorage.getItem(persistKey)
      ? Promise.resolve()
      : (() => {
          localStorage.setItem(persistKey, '1');
          const rsvpStatus =
            contextInvitee.rsvp_status === 'yes' || contextInvitee.rsvp_status === 'confirmed'
              ? 'yes'
              : 'no';
          return inviteeService
            .updateRsvp(Number(contextInvitee.id), {
              rsvpStatus,
              dietary: contextInvitee.dietary || undefined,
            })
            .then(() => {})
            .catch(() => {});
        })();

    persistPromise.then(() =>
      inviteeService.getById(Number(contextInvitee.id))
    ).then(res => {
      const i = res.invitee;
      const isPaidEvent = event ? event.price > 0 : false;
      const fresh: Invitee = {
        id: String(i.id),
        event_id: String(i.eventId),
        email: i.email || contextInvitee.email,
        firstname: i.firstname || contextInvitee.firstname,
        lastname: i.surname || contextInvitee.lastname,
        dietary: i.dietary || contextInvitee.dietary,
        rsvp_status: (i.rsvpStatus as any) || contextInvitee.rsvp_status,
        payment_status:
          status === 'success' && isPaidEvent
            ? 'paid'
            : ((i.paymentStatus as any) || contextInvitee.payment_status),
        invite_token: (i.inviteCode as any) || contextInvitee.invite_token,
        created_at: i.createdAt || contextInvitee.created_at,
      };
      setInvitee(fresh);
      updateInviteeLocal(fresh.id, fresh);
    }).catch(() => {
      // On API error: optimistically apply paid status for payment success
      if (status === 'success' && event && event.price > 0) {
        updateInviteeLocal(contextInvitee.id, { payment_status: 'paid' });
        setInvitee(prev => prev ? { ...prev, payment_status: 'paid' } : prev);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextInvitee?.id]);

  // Log RSVP confirmation email once (success status only)
  useEffect(() => {
    if (!invitee || !event || emailedRef.current || status !== 'success') return;
    const key = `rsvp_emailed_${invitee.id}`;
    if (localStorage.getItem(key)) return;
    emailedRef.current = true;
    localStorage.setItem(key, '1');

    const isConfirmed = invitee.rsvp_status === 'yes' || invitee.rsvp_status === 'confirmed';
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
  }, [invitee?.id, event?.id]);

  if (!invitee || !event) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-500">Invitation not found.</p>
        </div>
      </AttendeeLayout>
    );
  }

  const isConfirmed = invitee.rsvp_status === 'yes' || invitee.rsvp_status === 'confirmed';
  const calendarUrl = buildGoogleCalendarUrl(event);

  const rsvpDisplay = (() => {
    if (invitee.rsvp_status === 'yes' || invitee.rsvp_status === 'confirmed') {
      return { label: 'Attending', color: 'bg-emerald-100 text-emerald-700' };
    }
    if (invitee.rsvp_status === 'no' || invitee.rsvp_status === 'declined') {
      return { label: 'Not Attending', color: 'bg-slate-100 text-slate-600' };
    }
    return { label: 'Pending', color: 'bg-amber-100 text-amber-700' };
  })();

  const paymentDisplay = (() => {
    if (invitee.payment_status === 'paid') return { label: 'Paid', color: 'bg-emerald-100 text-emerald-700' };
    if (invitee.payment_status === 'invoice-issued') return { label: 'Invoice Sent', color: 'bg-amber-100 text-amber-700' };
    return { label: 'Pending', color: 'bg-slate-100 text-slate-600' };
  })();

  const statusConfig = (() => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="mx-auto mb-3 w-14 h-14 text-emerald-500" />,
          badgeClass: 'bg-emerald-100 text-emerald-700',
          badgeLabel: event.price > 0 ? 'Payment Confirmed' : 'RSVP Confirmed',
          heading: event.price > 0
            ? 'Payment successful!'
            : isConfirmed ? "You're all set!" : 'Thanks for letting us know',
          message: event.price > 0
            ? `Your payment for ${event.title} has been processed. A receipt has been sent to ${invitee.email}.`
            : isConfirmed
              ? `A confirmation has been sent to ${invitee.email}.`
              : `We've noted your response for ${event.title}.`,
          showCalendar: isConfirmed,
        };
      case 'cancel':
        return {
          icon: <AlertTriangle className="mx-auto mb-3 w-14 h-14 text-amber-400" />,
          badgeClass: 'bg-amber-100 text-amber-700',
          badgeLabel: 'Payment Cancelled',
          heading: 'Payment was cancelled',
          message: 'Your payment was not completed. Use your original invite link to try again.',
          showCalendar: false,
        };
      default: // failure
        return {
          icon: <AlertCircle className="mx-auto mb-3 w-14 h-14 text-red-500" />,
          badgeClass: 'bg-red-100 text-red-700',
          badgeLabel: 'Payment Failed',
          heading: 'Payment failed',
          message: 'There was a problem processing your payment. Please try again or contact the event organizer.',
          showCalendar: false,
        };
    }
  })();

  return (
    <AttendeeLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <div className="p-8 bg-white border shadow-lg rounded-xl border-slate-200">

            {/* ── Status Header ────────────────────────────── */}
            <div className="mb-6 text-center">
              {statusConfig.icon}
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${statusConfig.badgeClass}`}>
                {statusConfig.badgeLabel}
              </span>
              <h1 className="mb-1 text-xl font-bold text-slate-900">{statusConfig.heading}</h1>
              <p className="text-sm text-slate-500">{statusConfig.message}</p>
            </div>

            {/* ── RSVP & Payment Status Chips ──────────────── */}
            <div className="flex gap-3 mb-5">
              <div className="flex-1 px-3 py-2.5 border rounded-lg bg-slate-50 border-slate-200 text-center">
                <p className="mb-1 text-xs text-slate-500">RSVP</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rsvpDisplay.color}`}>
                  {rsvpDisplay.label}
                </span>
              </div>
              {event.price > 0 && (
                <div className="flex-1 px-3 py-2.5 border rounded-lg bg-slate-50 border-slate-200 text-center">
                  <p className="mb-1 text-xs text-slate-500">Payment</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${paymentDisplay.color}`}>
                    {paymentDisplay.label}
                  </span>
                </div>
              )}
            </div>

            {/* ── Event Details ─────────────────────────────── */}
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
                  <p className="text-xs text-slate-500">Start time</p>
                  <p className="text-sm font-semibold text-slate-900">{formatEventTime(event.start_time)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Location</p>
                  <p className="text-sm font-semibold text-slate-900">{event.location}</p>
                </div>
              </div>
              {invitee.dietary && (
                <div className="flex items-start gap-3">
                  <Utensils className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Dietary preference</p>
                    <p className="text-sm font-semibold text-slate-900">{invitee.dietary}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Add to Calendar ───────────────────────────── */}
            {statusConfig.showCalendar && (
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

            {/* ── Try Again (cancel / failure) ─────────────── */}
            {(status === 'cancel' || status === 'failure') && token && (
              <button
                onClick={() => navigate(`/rsvp/${token}/payment`)}
                className="flex items-center justify-center w-full gap-2 py-3 mt-3 font-semibold transition-colors border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                Try Payment Again
              </button>
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
