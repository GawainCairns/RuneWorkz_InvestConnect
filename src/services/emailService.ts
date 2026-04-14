import { API_BASE, apiPost } from './api';
import { TOKEN_STORAGE_KEY } from '../config/constants';

export type EmailTemplate = 'invite' | 'resend' | 'rsvp_complete';

export const emailService = {
  sendInvite(inviteeId: number): Promise<{ success: boolean; result: Record<string, unknown> }> {
    return apiPost(`/email/invite/${inviteeId}`);
  },

  resendInvite(inviteeId: number): Promise<{ success: boolean; result: Record<string, unknown> }> {
    return apiPost(`/email/resend/${inviteeId}`);
  },

  sendRsvpComplete(inviteeId: number): Promise<{ success: boolean; result: Record<string, unknown> }> {
    return apiPost(`/email/rsvp_complete/${inviteeId}`);
  },

  /** Fetches the rendered HTML preview for an event email template. */
  async getEmailPreview(eventId: number, template: EmailTemplate = 'invite'): Promise<string> {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const url = new URL(`${API_BASE}/email/getemail/event/${eventId}`);
    url.searchParams.set('template', template);
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch email preview: ${res.statusText}`);
    }
    return res.text();
  },
};
