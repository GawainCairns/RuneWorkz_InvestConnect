import { Check, Copy, DollarSign, Mail, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { useEmailLogs } from '../../contexts/EmailLogContext';
import { useInvitees } from '../../contexts/InviteeContext';
import type { Invitee } from '../../types/organizer';

interface InviteeTableProps {
  eventId: string;
  invitees: Invitee[];
}

function StatusBadge({ value, positive, negative }: { value: string; positive: string; negative: string }) {
  const isPositive = value === positive;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
        isPositive
          ? 'bg-emerald-100 text-emerald-700'
          : value === negative
          ? 'bg-red-100 text-red-700'
          : 'bg-slate-100 text-slate-600'
      }`}
    >
      {value}
    </span>
  );
}

export default function InviteeTable({ eventId, invitees }: InviteeTableProps) {
  const { markPaid } = useInvitees();
  const { logEmail } = useEmailLogs();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (invitee: Invitee) => {
    const link = `${window.location.origin}/rsvp/${invitee.invite_token}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(invitee.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleResend = async (invitee: Invitee) => {
    await logEmail({
      event_id: eventId,
      invitee_id: invitee.id,
      to_email: invitee.email,
      subject: `You're invited`,
      body: `<p>Hi ${invitee.firstname}, your invite link: ${window.location.origin}/rsvp/${invitee.invite_token}</p>`,
      type: 'resend',
    });
  };

  const handleMarkPaid = async (id: string) => {
    await markPaid(id);
  };

  if (invitees.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">No invitees yet. Use the form above to add guests.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Name</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Email</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">RSVP</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Payment</th>
            <th className="text-left py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Dietary</th>
            <th className="text-right py-3 px-4 font-medium text-slate-600 text-xs uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invitees.map(invitee => (
            <tr key={invitee.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-900">
                {invitee.firstname} {invitee.lastname}
              </td>
              <td className="py-3 px-4 text-slate-600">{invitee.email}</td>
              <td className="py-3 px-4">
                <StatusBadge value={invitee.rsvp_status} positive="confirmed" negative="declined" />
              </td>
              <td className="py-3 px-4">
                <StatusBadge value={invitee.payment_status} positive="paid" negative="" />
              </td>
              <td className="py-3 px-4 text-slate-600">
                {invitee.dietary ? (
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                    {invitee.dietary}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleCopyLink(invitee)}
                    title="Copy invite link"
                    className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    {copiedId === invitee.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleResend(invitee)}
                    title="Resend invite email"
                    className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  {invitee.payment_status !== 'paid' && (
                    <button
                      onClick={() => handleMarkPaid(invitee.id)}
                      title="Mark as paid"
                      className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
