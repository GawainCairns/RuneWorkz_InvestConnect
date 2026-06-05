import { ArrowLeft, Plus, Upload, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import type { Invitee } from '../../types/organizer';
import FormField from './FormField';
import InviteeTable from './InviteeTable';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

const SANITIZE_RE = /^[=+\-@]/;
function sanitizeCell(val: string) {
  return SANITIZE_RE.test(val) ? `'${val}` : val;
}

export default function InviteeList() {
  const { eventId } = useParams<{ eventId: string }>();
  const { getEvent } = useEvents();
  const { invitees, fetchInvitees, addInvitee, addInvitees } = useInvitees();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ email: '', firstname: '', lastname: '', dietary: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [csvError, setCsvError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const event = eventId ? getEvent(eventId) : undefined;
  const eventInvitees = invitees.filter(i => i.event_id === eventId);

  useEffect(() => {
    if (eventId) fetchInvitees(eventId);
  }, [eventId, fetchInvitees]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Valid email is required';
    }
    if (!form.firstname.trim()) errs.firstname = 'First name is required';
    if (!form.lastname.trim()) errs.lastname = 'Last name is required';
    return errs;
  };

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setFormErrors(prev => { const c = { ...prev }; delete c[field]; return c; });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      await addInvitee({
        event_id: eventId!,
        email: form.email.trim(),
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        dietary: form.dietary.trim(),
        rsvp_status: 'pending',
        payment_status: 'unpaid',
      });
      setForm({ email: '', firstname: '', lastname: '', dietary: '' });
      setFormErrors({});
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { setCsvError('CSV must have a header and at least one row.'); return; }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const emailIdx = header.indexOf('email');
    const firstIdx = header.indexOf('firstname') !== -1 ? header.indexOf('firstname') : header.indexOf('first_name');
    const lastIdx = header.indexOf('lastname') !== -1 ? header.indexOf('lastname') : header.indexOf('last_name');

    if (emailIdx === -1 || firstIdx === -1 || lastIdx === -1) {
      setCsvError('CSV must include columns: email, firstname, lastname');
      return;
    }

    const dietaryIdx = header.indexOf('dietary');
    const rows: Omit<Invitee, 'id' | 'invite_token' | 'created_at'>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => sanitizeCell(c.trim().replace(/^"|"$/g, '')));
      const email = cols[emailIdx] || '';
      const firstname = cols[firstIdx] || '';
      const lastname = cols[lastIdx] || '';
      if (!email || !firstname || !lastname) continue;
      rows.push({
        event_id: eventId!,
        email,
        firstname,
        lastname,
        dietary: dietaryIdx !== -1 ? cols[dietaryIdx] || '' : '',
        rsvp_status: 'pending',
        payment_status: 'unpaid',
      });
    }

    if (!rows.length) { setCsvError('No valid rows found in CSV.'); return; }
    await addInvitees(rows);
    if (fileRef.current) fileRef.current.value = '';
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

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 mb-6 text-sm transition-colors text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Event
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invitees</h1>
          <p className="mt-1 text-sm text-slate-500">{event.title}</p>
        </div>
        <span className="text-sm text-slate-500">{eventInvitees.length} invitee{eventInvitees.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <div className="p-6 bg-white border shadow-sm lg:col-span-2 rounded-xl border-slate-200">
          <h2 className="flex items-center gap-2 mb-4 text-base font-semibold text-slate-900">
            <UserPlus className="w-4 h-4 text-brand-600" />
            Add Invitee
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First Name" required>
                <input type="text" className={inputClass} placeholder="Jane" value={form.firstname} onChange={e => handleFieldChange('firstname', e.target.value)} />
              </FormField>
              <FormField label="Last Name" required>
                <input type="text" className={inputClass} placeholder="Smith" value={form.lastname} onChange={e => handleFieldChange('lastname', e.target.value)} />
              </FormField>
            </div>
            <FormField label="Email" required>
              <input type="email" className={inputClass} placeholder="jane@example.com" value={form.email} onChange={e => handleFieldChange('email', e.target.value)} />
            </FormField>
            <FormField label="Dietary Requirements" hint="Optional">
              <input type="text" className={inputClass} placeholder="e.g. Vegetarian, Gluten-free" value={form.dietary} onChange={e => handleFieldChange('dietary', e.target.value)} />
            </FormField>
            <div className="flex items-center justify-end gap-3">
              {Object.keys(formErrors).length > 0 && (
                <p className="text-sm text-red-600">{Object.values(formErrors).join('. ')}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {submitting ? 'Adding...' : 'Add Invitee'}
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 bg-white border shadow-sm rounded-xl border-slate-200">
          <h2 className="flex items-center gap-2 mb-4 text-base font-semibold text-slate-900">
            <Upload className="w-4 h-4 text-brand-600" />
            Upload CSV
          </h2>
          <p className="mb-4 text-xs text-slate-500">
            Required columns: <code className="px-1 rounded bg-slate-100">email</code>,{' '}
            <code className="px-1 rounded bg-slate-100">firstname</code>,{' '}
            <code className="px-1 rounded bg-slate-100">lastname</code>. Optional:{' '}
            <code className="px-1 rounded bg-slate-100">dietary</code>.
          </p>
          <label className="block">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <div
              onClick={() => fileRef.current?.click()}
              className="p-6 text-center transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-300 hover:border-brand-400 hover:bg-brand-50"
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">Click to upload CSV</p>
              <p className="mt-1 text-xs text-slate-500">Maximum 500 rows</p>
            </div>
          </label>
          {csvError && (
            <p className="mt-2 text-xs text-red-600">{csvError}</p>
          )}
        </div>
      </div>

      <div className="bg-white border shadow-sm rounded-xl border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Guest List</h2>
        </div>
        <div className="p-6">
          <InviteeTable eventId={eventId!} invitees={eventInvitees} />
        </div>
      </div>
    </div>
  );
}
