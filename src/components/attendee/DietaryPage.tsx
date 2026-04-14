import { Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import { DIETARY_OPTIONS } from '../../utils/attendee';
import AttendeeLayout from './AttendeeLayout';

export default function DietaryPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getInviteeByToken, updateInviteeLocal } = useInvitees();
  const { getEvent } = useEvents();

  const invitee = token ? getInviteeByToken(token) : undefined;
  const event = invitee ? getEvent(invitee.event_id) : undefined;

  const [selected, setSelected] = useState(invitee?.dietary || '');

  const handleContinue = () => {
    if (!invitee) return;
    updateInviteeLocal(invitee.id, { dietary: selected });
    if (event && event.price > 0) {
      navigate(`/rsvp/${token}/payment`);
    } else {
      navigate(`/rsvp/${token}/confirmation`);
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

  if (invitee.rsvp_status === 'declined') {
    navigate(`/rsvp/${token}/confirmation`);
    return null;
  }

  return (
    <AttendeeLayout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step 2 of 4</span>
          </div>
          <div className="h-1 w-full bg-slate-200 rounded-full mb-8 overflow-hidden">
            <div className="h-1 bg-brand-600 rounded-full" style={{ width: '50%' }} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Dietary Requirements</h1>
              <p className="text-slate-500 text-sm">
                Let us know if you have any dietary needs.
              </p>
            </div>

            <div className="space-y-2">
              {DIETARY_OPTIONS.map(option => {
                const isSelected = selected === option;
                return (
                  <button
                    key={option}
                    onClick={() => setSelected(option)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 text-brand-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={!selected}
              className="mt-6 w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    </AttendeeLayout>
  );
}
