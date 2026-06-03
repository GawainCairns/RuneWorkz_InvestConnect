import { Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvitees } from '../../contexts/InviteeContext';
import { useAttendeeRoute } from '../../hooks/useAttendeeRoute';
import { inviteeService } from '../../services/inviteeService';
import { DIETARY_OPTIONS } from '../../utils/attendee';
import AttendeeLayout from './AttendeeLayout';

export default function DietaryPage() {
  const { token, invitee, event, loading } = useAttendeeRoute();
  const navigate = useNavigate();
  const { updateInviteeLocal } = useInvitees();

  const [selected, setSelected] = useState(invitee?.dietary || '');
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!invitee) return;
    setSubmitting(true);
    try {
      updateInviteeLocal(invitee.id, { dietary: selected });
      await inviteeService.updateRsvp(Number(invitee.id), { dietary: selected });
    } catch {
      // continue regardless of API error
    } finally {
      setSubmitting(false);
    }
    if (event && event.price > 0) {
      navigate(`/rsvp/${token}/payment`);
    } else {
      navigate(`/rsvp/${token}/confirmation?status=success`);
    }
  };

  if (loading || !invitee || !event) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 rounded-full border-brand-600 border-t-transparent animate-spin" />
        </div>
      </AttendeeLayout>
    );
  }

  if (invitee.rsvp_status === 'declined') {
    navigate(`/rsvp/${token}/confirmation?status=success`);
    return null;
  }

  return (
    <AttendeeLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-2 text-center">
            <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">Step 2 of 4</span>
          </div>
          <div className="w-full h-1 mb-8 overflow-hidden rounded-full bg-slate-200">
            <div className="h-1 rounded-full bg-brand-600" style={{ width: '50%' }} />
          </div>

          <div className="p-8 bg-white border shadow-lg rounded-xl border-slate-200">
            <div className="mb-6 text-center">
              <h1 className="mb-1 text-2xl font-bold text-slate-900">Dietary Requirements</h1>
              <p className="text-sm text-slate-500">
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
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={!selected || submitting}
              className="w-full py-3 mt-6 font-semibold text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </AttendeeLayout>
  );
}
