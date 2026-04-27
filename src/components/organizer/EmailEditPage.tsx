import { ArrowLeft, Eye, RotateCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MouseEvent, KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import type { EventProperties } from '../../types/organizer';
import FormField from './FormField';
import { emailService, EmailTemplate } from '../../services/emailService';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

const defaultProps: Omit<EventProperties, 'event_id'> = {
  pre_text: '',
  post_text: '',
  catering: '',
  parking: '',
};

function buildPreview(event: { brand: string; title: string; description: string; location: string; date: string }, props: Omit<EventProperties, 'event_id'>) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
      <div style="background:#1d4ed8;color:white;padding:24px;border-radius:8px 8px 0 0;">
        <p style="margin:0;font-size:12px;opacity:0.8;text-transform:uppercase;letter-spacing:1px;">${event.brand}</p>
        <h1 style="margin:8px 0 0;font-size:22px;">${event.title}</h1>
      </div>
      <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
        ${props.pre_text ? `<p>${props.pre_text}</p>` : ''}
        <p style="color:#64748b;">${event.description}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Date:</strong> ${event.date}</p>
        ${props.catering ? `<p><strong>Catering:</strong> ${props.catering}</p>` : ''}
        ${props.parking ? `<p><strong>Parking:</strong> ${props.parking}</p>` : ''}
        ${props.post_text ? `<p>${props.post_text}</p>` : ''}
        <div style="margin-top:24px;text-align:center;">
          <a href="#" style="background:#2563eb;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;">RSVP Now</a>
        </div>
      </div>
    </div>
  `;
}

export default function EmailEditPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { getEvent } = useEvents();
  const [props, setProps] = useState<Omit<EventProperties, 'event_id'>>(defaultProps);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [remotePreviewHtml, setRemotePreviewHtml] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const handlePreviewClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element | null;
    const anchor = target?.closest ? (target.closest('a') as HTMLAnchorElement | null) : null;
    if (anchor) {
      e.preventDefault();
    }
  };

  const handlePreviewKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as Element | null;
    const anchor = target?.closest ? (target.closest('a') as HTMLAnchorElement | null) : null;
    if (anchor && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
    }
  };

  const event = eventId ? getEvent(eventId) : undefined;

  useEffect(() => {
    if (!eventId) return;
    const stored = localStorage.getItem(`event_props_${eventId}`);
    if (stored) {
      try { setProps(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [eventId]);

  const update = (field: keyof typeof defaultProps, value: string) => {
    setProps(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!eventId) return;
    localStorage.setItem(`event_props_${eventId}`, JSON.stringify(props));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    if (!eventId) return;
    localStorage.removeItem(`event_props_${eventId}`);
    setProps(defaultProps);
  };

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">Event not found.</p>
        <button onClick={() => navigate('/admin/events')} className="mt-4 text-brand-600 hover:underline text-sm">
          Back to Events
        </button>
      </div>
    );
  }

  const previewHtml = buildPreview(event, props);

  useEffect(() => {
    if (!showPreview || !eventId) return;
    setRemotePreviewHtml(null);
    setPreviewError(null);
    setLoadingPreview(true);
    const template: EmailTemplate = 'invite';
    emailService
      .getEmailPreview(Number(eventId), template)
      .then(html => setRemotePreviewHtml(html))
      .catch(err => setPreviewError(String(err?.message ?? err)))
      .finally(() => setLoadingPreview(false));
  }, [showPreview, eventId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(`/admin/events/${eventId}`)}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Template</h1>
          <p className="text-slate-500 text-sm mt-1">{event.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(p => !p)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              saved ? 'bg-emerald-600' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-2' : ''} gap-6`}>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <FormField label="Pre-Text" hint="Opening paragraph before event details">
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="You're invited to an exclusive event..."
              value={props.pre_text}
              onChange={e => update('pre_text', e.target.value)}
            />
          </FormField>
          <FormField label="Post-Text" hint="Closing paragraph after event details">
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="We look forward to seeing you there..."
              value={props.post_text}
              onChange={e => update('post_text', e.target.value)}
            />
          </FormField>
          <FormField label="Catering" hint="Details about food and beverages">
            <input
              type="text"
              className={inputClass}
              placeholder="Cocktails and canapes will be served"
              value={props.catering}
              onChange={e => update('catering', e.target.value)}
            />
          </FormField>
          <FormField label="Parking" hint="Parking information for guests">
            <input
              type="text"
              className={inputClass}
              placeholder="Free parking available at the venue"
              value={props.parking}
              onChange={e => update('parking', e.target.value)}
            />
          </FormField>
        </div>

        {showPreview && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 overflow-y-auto max-h-[600px]">
              {loadingPreview ? (
                <p className="text-sm text-slate-500">Loading preview…</p>
              ) : previewError ? (
                <div className="text-sm text-red-600">Failed to load preview: {previewError}</div>
              ) : (
                <div
                  onClick={handlePreviewClick}
                  onKeyDown={handlePreviewKeyDown}
                  dangerouslySetInnerHTML={{ __html: remotePreviewHtml ?? previewHtml }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
