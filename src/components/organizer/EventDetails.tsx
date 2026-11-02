import { ArrowLeft, Calendar, Clock, Coins, CreditCard as Edit, Mail, MapPin, Send, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAlert } from '../../contexts/AlertContext';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import EmailLogTable from './EmailLogTable';
import InviteeTable from './InviteeTable';
import { generateAttendancePDF, generateDietaryPDF } from '../../services/pdfService';
import { emailService } from '../../services/emailService';
import { eventService } from '../../services/eventService';
import { managerService } from '../../services/managerService';
import type { Manager } from '../../types/api';

type Tab = 'invitees' | 'managers' | 'emails';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
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

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { getEvent } = useEvents();
  const { invitees, fetchInvitees, addInvitee, addInvitees } = useInvitees();
  const { emailLogs, fetchEmailLogs, logEmail } = useEmailLogs();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<Tab>('invitees');
  const [showSingleForm, setShowSingleForm] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [singleFirst, setSingleFirst] = useState('');
  const [singleLast, setSingleLast] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleErrors, setSingleErrors] = useState<Record<string, string>>({});
  const [batchRaw, setBatchRaw] = useState('');
  const [batchError, setBatchError] = useState('');
  const [singleSubmitting, setSingleSubmitting] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  // Email template setup check
  const [emailTemplateReady, setEmailTemplateReady] = useState(false);
  const [checkingTemplate, setCheckingTemplate] = useState(true);

  // Managers state
  const [managers, setManagers] = useState<Manager[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [managerForm, setManagerForm] = useState({ name: '', email: '' });
  const [managerErrors, setManagerErrors] = useState<Record<string, string>>({});
  const [managerSubmitting, setManagerSubmitting] = useState(false);

  const validateSingle = () => {
    const e: Record<string, string> = {};
    if (!singleFirst.trim()) e.firstname = 'First name is required';
    if (!singleLast.trim()) e.lastname = 'Last name is required';
    if (!singleEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(singleEmail.trim())) e.email = 'Valid email is required';
    return e;
  };

  const event = eventId ? getEvent(eventId) : undefined;

  useEffect(() => {
    if (eventId) {
      fetchInvitees(eventId);
    }
  }, [eventId, fetchInvitees]);

  // Populate email logs for this event when the page loads
  useEffect(() => {
    if (eventId) fetchEmailLogs(eventId);
  }, [eventId, fetchEmailLogs]);

  useEffect(() => {
    if (activeTab === 'emails' && eventId) {
      fetchEmailLogs(eventId);
    }
  }, [activeTab, eventId, fetchEmailLogs]);

  // Check whether the email template has been set up (has invitationpre or invitationpost properties)
  useEffect(() => {
    if (!eventId) return;
    let mounted = true;
    setCheckingTemplate(true);
    eventService
      .getById(Number(eventId))
      .then(res => {
        const apiEvent = (res as any)?.event;
        const props = Array.isArray(apiEvent?.properties) ? apiEvent.properties : [];
        const hasPre = props.some((p: any) => p.name === 'invitationpre' && p.value && p.value.trim());
        const hasPost = props.some((p: any) => p.name === 'invitationpost' && p.value && p.value.trim());
        const stored = localStorage.getItem(`event_props_${eventId}`);
        let storedHasContent = false;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.invitationpre?.trim() || parsed.invitationpost?.trim()) storedHasContent = true;
          } catch { /* ignore */ }
        }
        if (mounted) setEmailTemplateReady(hasPre || hasPost || storedHasContent);
      })
      .catch(() => {
        if (mounted) {
          const stored = localStorage.getItem(`event_props_${eventId}`);
          let storedHasContent = false;
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.invitationpre?.trim() || parsed.invitationpost?.trim()) storedHasContent = true;
            } catch { /* ignore */ }
          }
          setEmailTemplateReady(storedHasContent);
        }
      })
      .finally(() => {
        if (mounted) setCheckingTemplate(false);
      });
    return () => { mounted = false; };
  }, [eventId]);

  // Fetch managers when the managers tab is active
  const fetchManagers = async () => {
    if (!eventId) return;
    setManagersLoading(true);
    try {
      const res = await managerService.getAll(Number(eventId));
      setManagers(res.managers || []);
    } catch {
      // ignore
    } finally {
      setManagersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'managers' && eventId) {
      fetchManagers();
    }
  }, [activeTab, eventId]);

  // Auto-switch to managers tab after adding a manager
  const handleAddManager = async () => {
    if (!eventId) return;
    const errs: Record<string, string> = {};
    if (!managerForm.name.trim()) errs.name = 'Manager name is required';
    if (!managerForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(managerForm.email.trim()))
      errs.email = 'A valid email is required';
    if (Object.keys(errs).length) {
      setManagerErrors(errs);
      return;
    }
    setManagerSubmitting(true);
    try {
      await managerService.create({
        eventId: Number(eventId),
        name: managerForm.name.trim(),
        email: managerForm.email.trim(),
      });
      setManagerForm({ name: '', email: '' });
      setManagerErrors({});
      setShowManagerForm(false);
      await fetchManagers();
      showAlert('Manager added successfully', 'success');
    } catch {
      showAlert('Failed to add manager', 'error');
    } finally {
      setManagerSubmitting(false);
    }
  };

  const handleDeleteManager = async (id: number) => {
    try {
      await managerService.delete(id);
      setManagers(prev => prev.filter(m => m.id !== id));
      showAlert('Manager removed', 'success');
    } catch {
      showAlert('Failed to remove manager', 'error');
    }
  };

  const handleResendNonRsvp = async () => {
    if (!eventId) return;
    const nonRsvpInvitees = eventInvitees.filter(
      i => i.email && i.rsvp_status !== 'yes' && i.rsvp_status !== 'confirmed'
    );
    if (nonRsvpInvitees.length === 0) {
      showAlert('No invitees with emails pending RSVP', 'info');
      return;
    }
    setResending(true);
    let successCount = 0;
    let failCount = 0;
    await Promise.allSettled(
      nonRsvpInvitees.map(async inv => {
        try {
          await emailService.resendInvite(Number(inv.id));
          await logEmail({
            event_id: eventId,
            invitee_id: inv.id,
            to_email: inv.email,
            subject: `You're invited`,
            body: `<p>Hi ${inv.firstname}, your invite link: ${window.location.origin}/rsvp/${inv.invite_token}</p>`,
            type: 'resend',
          });
          successCount++;
        } catch {
          failCount++;
        }
      })
    );
    setResending(false);
    if (failCount === 0) {
      showAlert(`Resent invites to ${successCount} invitee(s)`, 'success');
    } else {
      showAlert(`Sent to ${successCount}, failed for ${failCount}`, 'info');
    }
  };

  if (!event) {
    return (
      <div className="px-4 py-8 mx-auto text-center max-w-7xl">
        <p className="text-slate-500">Event not found.</p>
        <button onClick={() => window.history.back()} className="mt-4 text-sm text-brand-600 hover:underline">
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
    } catch {
      return false;
    }
  })();

  const managerCount = managers.length;

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => window.history.back()}
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
            {event.price > 0 ? (
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0">
                <Coins className="w-4 h-4" />
                R {event.price.toFixed(2)}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-semibold shrink-0">
                Free
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
            {(['invitees', 'managers', 'emails'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'invitees'
                  ? `Invitees (${eventInvitees.length})`
                  : tab === 'managers'
                  ? `Managers (${managerCount})`
                  : `Emails (${eventEmails.length})`}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
            {activeTab === 'invitees' && (
              <div>
                {!checkingTemplate && !emailTemplateReady && (
                  <div className="flex items-start gap-3 p-4 mb-4 bg-amber-50 border border-amber-300 rounded-lg">
                    <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800">Email template not set up</p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        You need to set up the email template before you can add invitees and send invitations.
                      </p>
                      <button
                        onClick={() => navigate(`/admin/events/${eventId}/email`)}
                        className="mt-2 px-3 py-1.5 text-sm font-medium text-white rounded-lg bg-amber-600 hover:bg-amber-700"
                      >
                        Set up Email Template
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-600">Manage invitees for this event.</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResendNonRsvp}
                      disabled={resending || !emailTemplateReady || checkingTemplate}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Resend invite emails to all invitees with emails who haven't RSVP'd"
                    >
                      <Send className={`w-4 h-4 ${resending ? 'animate-pulse' : ''}`} />
                      {resending ? 'Resending...' : 'Resend to Non-RSVP'}
                    </button>
                    <button
                      onClick={() => setShowSingleForm(true)}
                      disabled={!emailTemplateReady || checkingTemplate}
                      className="px-3 py-2 text-sm font-medium bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Invitee
                    </button>
                    <button
                      onClick={() => setShowBatchForm(true)}
                      disabled={!emailTemplateReady || checkingTemplate}
                      className="px-3 py-2 text-sm font-medium text-white rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Invitees (Batch)
                    </button>
                    <button
                      onClick={() => generateAttendancePDF(event, eventInvitees)}
                      className="px-3 py-2 text-sm font-medium bg-white border rounded-lg text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                      Attendance PDF
                    </button>
                    <button
                      onClick={() => generateDietaryPDF(event, eventInvitees)}
                      className="px-3 py-2 text-sm font-medium text-white rounded-lg bg-brand-600 hover:bg-brand-700"
                    >
                      Dietary PDF
                    </button>
                  </div>
                </div>

                <InviteeTable eventId={eventId!} invitees={eventInvitees} />
              </div>
            )}
            {activeTab === 'managers' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-600">Managers who have third-party registration links for this event.</div>
                  <button
                    onClick={() => setShowManagerForm(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg bg-brand-600 hover:bg-brand-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Manager
                  </button>
                </div>

                {managersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-4 rounded-full border-brand-600 border-t-transparent animate-spin" />
                  </div>
                ) : managers.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm">No managers yet. Add a manager to generate a third-party registration link.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Registration Link</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {managers.map(mgr => (
                          <tr key={mgr.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-medium text-slate-900">{mgr.name}</td>
                            <td className="py-3 px-4 text-slate-600">{mgr.email}</td>
                            <td className="py-3 px-4 text-slate-600">
                              <span className="text-xs text-brand-600">
                                {window.location.origin}/event/{eventId}/register/{mgr.id}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteManager(mgr.id)}
                                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'emails' && (
              <EmailLogTable emailLogs={eventEmails} />
            )}
        </div>
      </div>

      {showSingleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSingleForm(false)} />
          <div className="relative w-full max-w-md p-6 bg-white shadow-lg rounded-xl">
            <h3 className="mb-3 text-lg font-semibold">Add Invitee</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600">First name</label>
                <input value={singleFirst} onChange={e => { setSingleFirst(e.target.value); setSingleErrors(p => { const c = {...p}; delete c.firstname; return c; }); }} className="block w-full px-3 py-2 mt-1 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm text-slate-600">Last name</label>
                <input value={singleLast} onChange={e => { setSingleLast(e.target.value); setSingleErrors(p => { const c = {...p}; delete c.lastname; return c; }); }} className="block w-full px-3 py-2 mt-1 border rounded-md" />
              </div>
              <div>
                <label className="block text-sm text-slate-600">Email</label>
                <input value={singleEmail} onChange={e => { setSingleEmail(e.target.value); setSingleErrors(p => { const c = {...p}; delete c.email; return c; }); }} className="block w-full px-3 py-2 mt-1 border rounded-md" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              {Object.keys(singleErrors).length > 0 && (
                <p className="mr-auto text-sm text-red-600">{Object.values(singleErrors).join('. ')}</p>
              )}
              <button onClick={() => { setShowSingleForm(false); setSingleErrors({}); }} className="px-3 py-2 text-sm bg-white border rounded-lg">Cancel</button>
              <button
                onClick={async () => {
                  if (!eventId) return;
                  const errs = validateSingle();
                  if (Object.keys(errs).length) { setSingleErrors(errs); return; }
                  setSingleSubmitting(true);
                  try {
                    await addInvitee({
                      event_id: String(eventId),
                      email: singleEmail.trim(),
                      firstname: singleFirst.trim(),
                      lastname: singleLast.trim(),
                      rsvp_status: 'pending',
                      payment_status: 'unpaid',
                    } as any);
                    setSingleFirst('');
                    setSingleLast('');
                    setSingleEmail('');
                    setSingleErrors({});
                    setShowSingleForm(false);
                  } finally {
                    setSingleSubmitting(false);
                  }
                }}
                disabled={singleSubmitting}
                className={`px-3 py-2 text-sm text-white rounded-lg bg-brand-600 ${singleSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {singleSubmitting ? 'Saving...' : 'Save'}
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
            <textarea value={batchRaw} onChange={e => { setBatchRaw(e.target.value); setBatchError(''); }} rows={8} className="w-full p-3 border rounded-md" placeholder="John,Doe,john@example.com\nJane,Smith,jane@example.com" />
            <div className="flex items-center justify-end gap-2 mt-4">
              {batchError && (
                <p className="mr-auto text-sm text-red-600">{batchError}</p>
              )}
              <button onClick={() => { setShowBatchForm(false); setBatchError(''); }} className="px-3 py-2 text-sm bg-white border rounded-lg">Cancel</button>
              <button
                onClick={async () => {
                  if (!eventId) return;
                  const lines = batchRaw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                  if (!lines.length) { setBatchError('Enter at least one row.'); return; }
                  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  const invalid = lines.filter(l => {
                    const [fn, ln, em] = l.split(',').map(p => p.trim());
                    return !fn || !ln || !em || !emailRe.test(em);
                  });
                  if (invalid.length) { setBatchError(`${invalid.length} row(s) have missing or invalid fields (format: firstname,lastname,email).`); return; }
                  setBatchSubmitting(true);
                  try {
                    const items = lines.map(l => {
                      const [firstname = '', lastname = '', email = ''] = l.split(',').map(p => p.trim());
                      return { event_id: String(eventId), firstname, lastname, email, dietary: '', rsvp_status: 'pending', payment_status: 'unpaid' };
                    });
                    await addInvitees(items as any);
                    setBatchRaw('');
                    setBatchError('');
                    setShowBatchForm(false);
                  } finally {
                    setBatchSubmitting(false);
                  }
                }}
                disabled={batchSubmitting}
                className={`px-3 py-2 text-sm text-white rounded-lg bg-brand-600 ${batchSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {batchSubmitting ? 'Saving...' : 'Save All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showManagerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowManagerForm(false)} />
          <div className="relative w-full max-w-md p-6 bg-white shadow-lg rounded-xl">
            <h3 className="mb-3 text-lg font-semibold">Add Manager</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600">Name</label>
                <input
                  value={managerForm.name}
                  onChange={e => { setManagerForm(p => ({ ...p, name: e.target.value })); setManagerErrors(p => { const c = {...p}; delete c.name; return c; }); }}
                  className={inputClass}
                  placeholder="Manager name"
                />
                {managerErrors.name && <p className="mt-1 text-xs text-red-600">{managerErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm text-slate-600">Email</label>
                <input
                  value={managerForm.email}
                  onChange={e => { setManagerForm(p => ({ ...p, email: e.target.value })); setManagerErrors(p => { const c = {...p}; delete c.email; return c; }); }}
                  className={inputClass}
                  placeholder="manager@example.com"
                />
                {managerErrors.email && <p className="mt-1 text-xs text-red-600">{managerErrors.email}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => { setShowManagerForm(false); setManagerErrors({}); }} className="px-3 py-2 text-sm bg-white border rounded-lg">Cancel</button>
              <button
                onClick={handleAddManager}
                disabled={managerSubmitting}
                className={`px-3 py-2 text-sm text-white rounded-lg bg-brand-600 ${managerSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {managerSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
