import { FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FormField from '../organizer/FormField';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useEvents } from '../../contexts/EventContext';
import { useInvitees } from '../../contexts/InviteeContext';
import type { Invoice } from '../../types/organizer';
import { generateInvoiceNumber } from '../../utils/attendee';
import AttendeeLayout from './AttendeeLayout';

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

export default function InvoiceForm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { getInviteeByToken, updateInvitee } = useInvitees();
  const { getEvent } = useEvents();
  const { logEmail } = useEmailLogs();

  const [form, setForm] = useState({
    entity_name: '',
    address: '',
    vat_number: '',
    contact_person: '',
    contact_email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const invitee = token ? getInviteeByToken(token) : undefined;
  const event = invitee ? getEvent(invitee.event_id) : undefined;

  if (!invitee || !event) {
    return (
      <AttendeeLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Invitation not found.</p>
        </div>
      </AttendeeLayout>
    );
  }

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.entity_name.trim()) errs.entity_name = 'Entity name is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.contact_person.trim()) errs.contact_person = 'Contact person is required';
    if (!form.contact_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      errs.contact_email = 'Valid email is required';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const invoice: Invoice = {
        number: generateInvoiceNumber(),
        entity_name: form.entity_name.trim(),
        address: form.address.trim(),
        vat_number: form.vat_number.trim(),
        contact_person: form.contact_person.trim(),
        contact_email: form.contact_email.trim(),
        amount: event.price,
        issued_at: new Date().toISOString(),
      };

      await updateInvitee(invitee.id, {
        payment_status: 'invoice-issued',
        invoice,
      });

      await logEmail({
        event_id: event.id,
        invitee_id: invitee.id,
        to_email: form.contact_email.trim(),
        subject: `Invoice ${invoice.number} — ${event.title}`,
        body: `<p>Dear ${form.contact_person},</p><p>Please find your invoice <strong>${invoice.number}</strong> for <strong>${event.title}</strong> attached.</p><p>Amount: $${event.price.toFixed(2)}</p><p>Entity: ${form.entity_name}</p><p>Address: ${form.address}</p>${form.vat_number ? `<p>VAT: ${form.vat_number}</p>` : ''}<p>Thank you.</p>`,
        type: 'other',
      });

      navigate(`/rsvp/${token}/confirmation`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AttendeeLayout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Step 3 of 4</span>
          </div>
          <div className="h-1 w-full bg-slate-200 rounded-full mb-8 overflow-hidden">
            <div className="h-1 bg-brand-600 rounded-full" style={{ width: '75%' }} />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-brand-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Invoice Details</h1>
                <p className="text-xs text-slate-500">We'll email you the invoice</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3 mb-6 flex justify-between items-center">
              <span className="text-sm text-slate-600">{event.title}</span>
              <span className="text-base font-bold text-slate-900">${event.price.toFixed(2)}</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Entity Name" required error={errors.entity_name}>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Company or individual name"
                  value={form.entity_name}
                  onChange={e => update('entity_name', e.target.value)}
                />
              </FormField>
              <FormField label="Billing Address" required error={errors.address}>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Street, City, Country"
                  value={form.address}
                  onChange={e => update('address', e.target.value)}
                />
              </FormField>
              <FormField label="VAT Number" hint="Optional" error={errors.vat_number}>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="e.g. GB123456789"
                  value={form.vat_number}
                  onChange={e => update('vat_number', e.target.value)}
                />
              </FormField>
              <FormField label="Contact Person" required error={errors.contact_person}>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Full name"
                  value={form.contact_person}
                  onChange={e => update('contact_person', e.target.value)}
                />
              </FormField>
              <FormField label="Invoice Email" required error={errors.contact_email}>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="billing@company.com"
                  value={form.contact_email}
                  onChange={e => update('contact_email', e.target.value)}
                />
              </FormField>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-brand-600 text-white font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors mt-2"
              >
                {submitting ? 'Generating...' : 'Generate Invoice →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AttendeeLayout>
  );
}
