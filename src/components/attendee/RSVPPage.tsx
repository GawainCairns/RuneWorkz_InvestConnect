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
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Invitation not found.</p>
        </div>
      </AttendeeLayout>
    );
  }

  return (
    <AttendeeLayout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step 1 of 4</span>
          </div>
          <div className="h-1 w-full bg-slate-200 rounded-full mb-8 overflow-hidden">
            <div className="h-1 bg-brand-600 rounded-full" style={{ width: '25%' }} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                {event.brand}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 mt-3 mb-1">{event.title}</h1>
              <p className="text-slate-500 text-sm">
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
                className="flex flex-col items-center gap-3 py-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 transition-all disabled:opacity-50 group"
              >
                <ThumbsUp className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-base font-bold text-emerald-700">Yes, I'll attend</span>
              </button>
              <button
                onClick={() => handleRSVP('no')}
                disabled={submitting}
                className="flex flex-col items-center gap-3 py-6 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all disabled:opacity-50 group"
              >
                <ThumbsDown className="w-8 h-8 text-slate-400 group-hover:scale-110 transition-transform" />
                <span className="text-base font-bold text-slate-500">No, I can't make it</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            You can change your RSVP by using the original invite link.
          </p>
        </div>
      </div>
    </AttendeeLayout>
  );
}
