import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface EmailPreviewModalProps {
  subject: string;
  toEmail: string;
  sentAt: string;
  body: string;
  onClose: () => void;
}

export default function EmailPreviewModal({ subject, toEmail, sentAt, body, onClose }: EmailPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:16px;margin:0;font-size:14px;line-height:1.6;color:#1e293b;}</style></head><body>${body}</body></html>`);
    doc.close();
  }, [body]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-10">
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{subject}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              To: {toEmail} &middot; {new Date(sentAt).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            title="Email Preview"
            sandbox="allow-same-origin"
            className="w-full h-full min-h-[400px]"
          />
        </div>
      </div>
    </div>
  );
}
