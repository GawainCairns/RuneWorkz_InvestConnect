import { Calendar, MapPin, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import { formatEventDate } from '../../utils/attendee';
import AttendeeLayout from './AttendeeLayout';

export default function RSVPPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getInviteeByToken, updateInvitee, updateInviteeLocal } = useInvitees();
  const { getEvent } = useEvents();
  const [submitting, setSubmitting] = useState(false);

  const invitee = token ? getInviteeByToken(token) : undefined;
  const event = invitee ? getEvent(invitee.event_id) : undefined;

  const handleRSVP = async (choice: 'yes' | 'no') => {
    if (!invitee) return;
    setSubmitting(true);
    try {
      if (choice === 'yes') {
        updateInviteeLocal(invitee.id, { rsvp_status: 'confirmed' });
        navigate(`/rsvp/${token}/dietary`);
      } else {
        await updateInvitee(invitee.id, { rsvp_status: 'declined' });
        navigate(`/rsvp/${token}/confirmation`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!invitee || !event) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-500">Invitation not found.</p>
        </div>
      </AttendeeLayout>
    );
  }

  return (
    <AttendeeLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-2 text-center">
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Step 1 of 4</span>
          </div>
          <div className="w-full h-1 mb-8 overflow-hidden rounded-full bg-slate-200">
            <div className="h-1 rounded-full bg-brand-600" style={{ width: '25%' }} />
          </div>

          <div className="p-8 bg-white border shadow-lg rounded-xl border-slate-200">
            <div className="mb-8 text-center">
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                {event.brand}
              </span>
              <h1 className="mt-3 mb-1 text-2xl font-bold text-slate-900">{event.title}</h1>
              <p className="text-sm text-slate-500">
                Hi {invitee.firstname}, will you be attending?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {formatEventDate(event.date)}
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {event.location}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleRSVP('yes')}
                disabled={submitting}
                className="flex flex-col items-center gap-3 py-6 transition-all border-2 rounded-xl border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 disabled:opacity-50 group"
              >
                <ThumbsUp className="w-8 h-8 transition-transform text-emerald-600 group-hover:scale-110" />
                <span className="text-base font-bold text-emerald-700">Yes, I'll attend</span>
              </button>
              <button
                onClick={() => handleRSVP('no')}
                disabled={submitting}
                className="flex flex-col items-center gap-3 py-6 transition-all border-2 rounded-xl border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 group"
              >
                <ThumbsDown className="w-8 h-8 transition-transform text-slate-400 group-hover:scale-110" />
                <span className="text-base font-bold text-slate-500">No, I can't make it</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-xs text-center text-slate-400">
            You can change your RSVP by using the original invite link.
          </p>
        </div>
      </div>
    </AttendeeLayout>
  );
}
