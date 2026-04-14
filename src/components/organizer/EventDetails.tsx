import { ArrowLeft, Calendar, Clock, DollarSign, CreditCard as Edit, Mail, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import EmailLogTable from './EmailLogTable';
import InviteeTable from './InviteeTable';

type Tab = 'invitees' | 'emails';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { getEvent } = useEvents();
  const { invitees, fetchInvitees } = useInvitees();
  const { emailLogs, fetchEmailLogs } = useEmailLogs();
  const [activeTab, setActiveTab] = useState<Tab>('invitees');

  const event = eventId ? getEvent(eventId) : undefined;

  useEffect(() => {
    if (eventId) {
      fetchInvitees(eventId);
    }
  }, [eventId, fetchInvitees]);

  useEffect(() => {
    if (activeTab === 'emails' && eventId) {
      fetchEmailLogs(eventId);
    }
  }, [activeTab, eventId, fetchEmailLogs]);

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Event not found.</p>
        <button onClick={() => navigate('/admin/events')} className="mt-4 text-brand-600 hover:underline text-sm">
          Back to Events
        </button>
      </div>
    );
  }

  const eventInvitees = invitees.filter(i => i.event_id === eventId);
  const confirmedCount = eventInvitees.filter(i => i.rsvp_status === 'confirmed').length;
  const paidCount = eventInvitees.filter(i => i.payment_status === 'paid').length;
  const eventEmails = emailLogs.filter(l => l.event_id === eventId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/events/${eventId}/email`)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email Template
          </button>
          <button
            onClick={() => navigate(`/admin/events/${eventId}/edit`)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Event
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="inline-block text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full mb-2">
                {event.brand}
              </span>
              <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
              {event.description && (
                <p className="text-slate-500 mt-1.5 text-sm">{event.description}</p>
              )}
            </div>
            {event.price > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0">
                <DollarSign className="w-4 h-4" />
                {event.price.toFixed(2)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              {formatDate(event.date)}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              {formatTime(event.start_time)} – {formatTime(event.end_time)}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              {event.location}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-slate-900">{eventInvitees.length}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" />
                Invited
              </div>
            </div>
            <div className="bg-emerald-50 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-emerald-700">{confirmedCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Confirmed</div>
            </div>
            <div className="bg-brand-50 rounded-lg px-4 py-3 text-center">
              <div className="text-2xl font-bold text-brand-700">{paidCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">Paid</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200">
          <div className="flex">
            {(['invitees', 'emails'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'invitees' ? `Invitees (${eventInvitees.length})` : `Emails (${eventEmails.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'invitees' && (
            <InviteeTable eventId={eventId!} invitees={eventInvitees} />
          )}
          {activeTab === 'emails' && (
            <EmailLogTable emailLogs={eventEmails} />
          )}
        </div>
      </div>
    </div>
  );
}
