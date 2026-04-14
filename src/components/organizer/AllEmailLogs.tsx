import { ChevronDown, ChevronRight, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import type { EmailLog } from '../../types/organizer';
import EmailPreviewModal from './EmailPreviewModal';

type EmailType = 'Invites' | 'RSVPs' | 'Resends' | 'Other';

function inferType(log: EmailLog): EmailType {
  if (log.type === 'invite') return 'Invites';
  if (log.type === 'rsvp') return 'RSVPs';
  if (log.type === 'resend') return 'Resends';
  return 'Other';
}

export default function AllEmailLogs() {
  const { events } = useEvents();
  const { emailLogs, loading, fetchEmailLogs } = useEmailLogs();
  const [preview, setPreview] = useState<EmailLog | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEmailLogs();
  }, [fetchEmailLogs]);

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      next.has(eventId) ? next.delete(eventId) : next.add(eventId);
      return next;
    });
  };

  const eventGroups = events.map(event => {
    const logs = emailLogs.filter(l => l.event_id === event.id);
    const grouped: Record<EmailType, EmailLog[]> = { Invites: [], RSVPs: [], Resends: [], Other: [] };
    logs.forEach(log => grouped[inferType(log)].push(log));
    return { event, grouped, total: logs.length };
  }).filter(g => g.total > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">All Email Logs</h1>
        <p className="text-slate-500 text-sm mt-1">
          {emailLogs.length} email{emailLogs.length !== 1 ? 's' : ''} across all events
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : eventGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No emails logged</h3>
          <p className="text-slate-500 text-sm">Email logs will appear here once invites are sent.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {eventGroups.map(({ event, grouped, total }) => {
            const isExpanded = expandedEvents.has(event.id);
            return (
              <div key={event.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleEvent(event.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <div className="text-left">
                      <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mr-2">
                        {event.brand}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{event.title}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{total} email{total !== 1 ? 's' : ''}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 pb-4">
                    {(['Invites', 'RSVPs', 'Resends', 'Other'] as EmailType[]).map(type => {
                      const logs = grouped[type];
                      if (!logs.length) return null;
                      return (
                        <div key={type} className="mt-4">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            {type} ({logs.length})
                          </h4>
                          <div className="space-y-1">
                            {logs.map(log => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-800 truncate">{log.subject}</p>
                                  <p className="text-xs text-slate-500 truncate">{log.to_email}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                  <span className="text-xs text-slate-400">
                                    {new Date(log.sent_at).toLocaleDateString()}
                                  </span>
                                  <button
                                    onClick={() => setPreview(log)}
                                    className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
                                  >
                                    Preview
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <EmailPreviewModal
          subject={preview.subject}
          toEmail={preview.to_email}
          sentAt={preview.sent_at}
          body={preview.body}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
