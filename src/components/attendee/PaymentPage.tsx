import { CreditCard, FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import AttendeeLayout from './AttendeeLayout';

type PaymentMethod = 'card' | 'invoice';

export default function PaymentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getInviteeByToken, updateInvitee } = useInvitees();
  const { getEvent } = useEvents();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [submitting, setSubmitting] = useState(false);

  const invitee = token ? getInviteeByToken(token) : undefined;
  const event = invitee ? getEvent(invitee.event_id) : undefined;

  if (!invitee || !event) {
    return (
      <AttendeeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Invitation not found.</p>
        </div>
      </AttendeeLayout>
    );
  }

  if (invitee.rsvp_status !== 'confirmed') {
    navigate(`/rsvp/${token}/respond`);
    return null;
  }

  const handleContinue = async () => {
    setSubmitting(true);
    try {
      if (paymentMethod === 'card') {
        await updateInvitee(invitee.id, { payment_status: 'paid' });
        navigate(`/rsvp/${token}/confirmation`);
      } else {
        navigate(`/rsvp/${token}/invoice`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AttendeeLayout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step 3 of 4</span>
          </div>
          <div className="h-1 w-full bg-slate-200 rounded-full mb-8 overflow-hidden">
            <div className="h-1 bg-brand-600 rounded-full" style={{ width: '75%' }} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Payment</h1>
              <p className="text-slate-500 text-sm">Choose how you'd like to pay</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 px-5 py-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Amount due</p>
                <p className="text-2xl font-bold text-slate-900">${event.price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-0.5">Event</p>
                <p className="text-sm font-semibold text-slate-700 max-w-[140px] truncate">{event.title}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                {
                  id: 'card' as PaymentMethod,
                  icon: <CreditCard className="w-5 h-5" />,
                  label: 'Pay now',
                  desc: 'Proceed with card payment',
                },
                {
                  id: 'invoice' as PaymentMethod,
                  icon: <FileText className="w-5 h-5" />,
                  label: 'Request invoice',
                  desc: "We'll send an invoice to your email",
                },
              ].map(option => {
                const isSelected = paymentMethod === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-brand-800' : 'text-slate-800'}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                    </div>
                    <div className="ml-auto shrink-0">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={submitting}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {submitting
                ? 'Processing...'
                : paymentMethod === 'card'
                ? 'Pay Now →'
                : 'Request Invoice →'}
            </button>
          </div>
        </div>
      </div>
    </AttendeeLayout>
  );
}
