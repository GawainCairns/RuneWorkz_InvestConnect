import { Eye, Mail, ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { EmailLog } from '../../types/organizer';
import EmailPreviewModal from './EmailPreviewModal';

interface EmailLogTableProps {
  emailLogs: EmailLog[];
}

export default function EmailLogTable({ emailLogs }: EmailLogTableProps) {
  const [selected, setSelected] = useState<EmailLog | null>(null);
  const [preview, setPreview] = useState<EmailLog | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const map = new Map<string, EmailLog[]>();
    for (const log of [...emailLogs].sort((a, b) => +new Date(b.sent_at) - +new Date(a.sent_at))) {
      const key = log.subject?.trim() || '(No subject)';
      const arr = map.get(key) || [];
      arr.push(log);
      map.set(key, arr);
    }
    return Array.from(map.entries()).map(([subject, logs]) => ({ subject, logs }));
  }, [emailLogs]);

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
          {groups.map(group => (
            <div key={group.subject} className="border-b border-slate-100 last:border-0">
              <button
                onClick={() => {
                  setExpandedSubjects(prev => ({ ...prev, [group.subject]: !prev[group.subject] }));
                  // auto-select latest in group when expanding
                  if (!expandedSubjects[group.subject] && group.logs.length > 0) setSelected(group.logs[0]);
                }}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {expandedSubjects[group.subject] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                  <div className="text-sm font-medium text-slate-800 truncate">{group.subject}</div>
                </div>
                <div className="text-xs text-slate-400">{group.logs.length}</div>
              </button>

              {expandedSubjects[group.subject] && (
                <div className="pl-12">
                  {group.logs.map(log => (
                    <button
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className={`w-full text-left px-4 py-3 border-t border-slate-100 last:border-b hover:bg-slate-50 transition-colors ${
                        selected?.id === log.id ? 'bg-brand-50 border-l-2 border-l-brand-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-slate-800 truncate">{log.to_email}</p>
                        <span className="text-xs text-slate-400 shrink-0">
                          {new Date(log.sent_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{new Date(log.sent_at).toLocaleTimeString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
