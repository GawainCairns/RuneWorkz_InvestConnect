import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import EmailLogTable from './EmailLogTable';

export default function EmailLogs() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { getEvent } = useEvents();
  const { emailLogs, loading, fetchEmailLogs } = useEmailLogs();

  const event = eventId ? getEvent(eventId) : undefined;
  const eventEmails = emailLogs.filter(l => l.event_id === eventId);

  useEffect(() => {
    if (eventId) fetchEmailLogs(eventId);
  }, [eventId, fetchEmailLogs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(`/admin/events/${eventId}`)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Email Logs</h1>
        {event && <p className="text-slate-500 text-sm mt-1">{event.title}</p>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <EmailLogTable emailLogs={eventEmails} />
        </div>
      )}
    </div>
  );
}
