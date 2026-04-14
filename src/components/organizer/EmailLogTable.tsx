import { Eye, Mail } from 'lucide-react';
import { useState } from 'react';
import type { EmailLog } from '../../types/organizer';
import EmailPreviewModal from './EmailPreviewModal';

interface EmailLogTableProps {
  emailLogs: EmailLog[];
}

export default function EmailLogTable({ emailLogs }: EmailLogTableProps) {
  const [selected, setSelected] = useState<EmailLog | null>(null);
  const [preview, setPreview] = useState<EmailLog | null>(null);

  if (emailLogs.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">No emails logged yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-96">
        <div className="md:col-span-2 border border-slate-200 rounded-lg overflow-y-auto">
          {emailLogs.map(log => (
            <button
              key={log.id}
              onClick={() => setSelected(log)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${
                selected?.id === log.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800 truncate">{log.subject}</p>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(log.sent_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">{log.to_email}</p>
            </button>
          ))}
        </div>

        <div className="md:col-span-3 border border-slate-200 rounded-lg p-4 overflow-y-auto">
          {selected ? (
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-semibold text-slate-900">{selected.subject}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    To: {selected.to_email} &middot;{' '}
                    {new Date(selected.sent_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setPreview(selected)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
              <div
                className="text-sm text-slate-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selected.body }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Mail className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Select an email to view details</p>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <EmailPreviewModal
          subject={preview.subject}
          toEmail={preview.to_email}
          sentAt={preview.sent_at}
          body={preview.body}
          onClose={() => setPreview(null)}
        />
      )}
    </>
  );
}
