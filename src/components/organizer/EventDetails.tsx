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
  const { invitees, fetchInvitees, addInvitee, addInvitees } = useInvitees();
  const { emailLogs, fetchEmailLogs } = useEmailLogs();
  const [activeTab, setActiveTab] = useState<Tab>('invitees');
  const [showSingleForm, setShowSingleForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [singleFirst, setSingleFirst] = useState('');
  const [singleLast, setSingleLast] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [batchRaw, setBatchRaw] = useState('');

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
      <div className="px-4 py-8 mx-auto text-center max-w-7xl">
        <p className="text-slate-500">Event not found.</p>
        <button onClick={() => navigate('/admin/events')} className="mt-4 text-sm text-brand-600 hover:underline">
          Back to Events
        </button>
      </div>
    );
  }

  const eventInvitees = invitees.filter(i => i.event_id === eventId);
  const confirmedCount = eventInvitees.filter(i => i.rsvp_status === 'yes').length;
  const paidCount = eventInvitees.filter(i => i.payment_status === 'paid').length;
  const eventEmails = emailLogs.filter(l => l.event_id === eventId);

  const isPast = (() => {
    try {
      const end = new Date(event.date);
      if (event.end_time) {
        const [eh, em] = event.end_time.split(':');
        end.setHours(Number(eh), Number(em), 0, 0);
      } else {
        end.setHours(23, 59, 59, 999);
      }
      return end < new Date();
    } catch (err) {
      return false;
    }
  })();

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin/events')}
          className="flex items-center gap-2 text-sm transition-colors text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/events/${eventId}/email`)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            <Mail className="w-4 h-4" />
            Email Template
          </button>
          <button
            onClick={() => navigate(`/admin/events/${eventId}/edit`)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700"
          >
            <Edit className="w-4 h-4" />
            Edit Event
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white border shadow-sm rounded-xl border-slate-200">
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

          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
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

          {!isPast && (
            <div className="grid grid-cols-3 gap-4">
              <div className="px-4 py-3 text-center rounded-lg bg-slate-50">
                <div className="text-2xl font-bold text-slate-900">{eventInvitees.length}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Invited
                </div>
              </div>
              <div className="px-4 py-3 text-center rounded-lg bg-emerald-50">
                <div className="text-2xl font-bold text-emerald-700">{confirmedCount}</div>
                <div className="text-xs text-slate-500 mt-0.5">Confirmed</div>
              </div>
              <div className="px-4 py-3 text-center rounded-lg bg-brand-50">
                <div className="text-2xl font-bold text-brand-700">{paidCount}</div>
                <div className="text-xs text-slate-500 mt-0.5">Paid</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border shadow-sm rounded-xl border-slate-200">
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
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-600">Manage invitees for this event.</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSingleForm(true)}
                      className="px-3 py-2 text-sm font-medium bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                      Add Invitee
                    </button>
                    <button
                      onClick={() => setShowBatchForm(true)}
                      className="px-3 py-2 text-sm font-medium text-white rounded-lg bg-brand-600 hover:bg-brand-700"
                    >
                      Add Invitees (Batch)
                    </button>
                  </div>
                </div>

                <InviteeTable eventId={eventId!} invitees={eventInvitees} />
              </div>
            )}
              {showSingleForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowSingleForm(false)} />
                  <div className="relative w-full max-w-md p-6 bg-white shadow-lg rounded-xl">
                    <h3 className="mb-3 text-lg font-semibold">Add Invitee</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-600">First name</label>
                        <input value={singleFirst} onChange={e => setSingleFirst(e.target.value)} className="block w-full px-3 py-2 mt-1 border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600">Last name</label>
                        <input value={singleLast} onChange={e => setSingleLast(e.target.value)} className="block w-full px-3 py-2 mt-1 border rounded-md" />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-600">Email</label>
                        <input value={singleEmail} onChange={e => setSingleEmail(e.target.value)} className="block w-full px-3 py-2 mt-1 border rounded-md" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setShowSingleForm(false)} className="px-3 py-2 text-sm bg-white border rounded-lg">Cancel</button>
                      <button
                        onClick={async () => {
                          if (!eventId) return;
                          try {
                            await addInvitee({
                              event_id: String(eventId),
                              email: singleEmail.trim(),
                              firstname: singleFirst.trim(),
                              lastname: singleLast.trim(),
                              rsvp_status: 'pending',
                              payment_status: 'unpaid',
                            } as any);
                          } finally {
                            setSingleFirst('');
                            setSingleLast('');
                            setSingleEmail('');
                            setShowSingleForm(false);
                          }
                        }}
                        className="px-3 py-2 text-sm text-white rounded-lg bg-brand-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {showBatchForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/40" onClick={() => setShowBatchForm(false)} />
                  <div className="relative w-full max-w-2xl p-6 bg-white shadow-lg rounded-xl">
                    <h3 className="mb-3 text-lg font-semibold">Add Invitees (Batch)</h3>
                    <p className="mb-3 text-sm text-slate-600">Enter one entry per line using comma-separated fields: <span className="font-mono">firstname,lastname,email</span></p>
                    <textarea value={batchRaw} onChange={e => setBatchRaw(e.target.value)} rows={8} className="w-full p-3 border rounded-md" placeholder="John,Doe,john@example.com\nJane,Smith,jane@example.com" />
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setShowBatchForm(false)} className="px-3 py-2 text-sm bg-white border rounded-lg">Cancel</button>
                      <button
                        onClick={async () => {
                          if (!eventId) return;
                          try {
                            const lines = batchRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                            const items = lines.map(l => {
                              const [firstname = '', lastname = '', email = ''] = l.split(',').map(p => p.trim());
                              return { event_id: String(eventId), firstname, lastname, email, dietary: '', rsvp_status: 'pending', payment_status: 'unpaid' };
                            });
                            if (items.length > 0) await addInvitees(items as any);
                          } finally {
                            setBatchRaw('');
                            setShowBatchForm(false);
                          }
                        }}
                        className="px-3 py-2 text-sm text-white rounded-lg bg-brand-600"
                      >
                        Save All
                      </button>
                    </div>
                  </div>
                </div>
              )}
          {activeTab === 'emails' && (
            <EmailLogTable emailLogs={eventEmails} />
          )}
        </div>
      </div>
    </div>
  );
}
