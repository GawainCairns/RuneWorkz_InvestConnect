import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import EmailLogTable from './EmailLogTable';

export default function EmailLogs() {
  const { eventId } = useParams<{ eventId: string }>();
  const { getEvent } = useEvents();
  const { emailLogs, loading, fetchEmailLogs } = useEmailLogs();

  const event = eventId ? getEvent(eventId) : undefined;
  const eventEmails = emailLogs.filter(l => l.event_id === eventId);

  useEffect(() => {
    if (eventId) fetchEmailLogs(eventId);
  }, [eventId, fetchEmailLogs]);

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 mb-6 text-sm transition-colors text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Email Logs</h1>
        {event && <p className="mt-1 text-sm text-slate-500">{event.title}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="border-4 rounded-full w-7 h-7 border-brand-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
          <EmailLogTable emailLogs={eventEmails} />
        </div>
      )}
    </div>
  );
}
