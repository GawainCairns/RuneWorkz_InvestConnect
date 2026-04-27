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
    const headers: Record<string, string> = {
      Accept: 'text/html',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const url = `${API_BASE}/email/getemail/event/${eventId}?template=${encodeURIComponent(template)}`;
    const res = await fetch(url, { method: 'POST', headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch email preview: ${res.statusText}`);
    }
    const text = await res.text();
    // Try to parse JSON responses even if content-type isn't accurate
    try {
      const body = JSON.parse(text);
      if (body && typeof body === 'object') {
        if ('html' in body && body.html) return String(body.html);
        if ('rendered' in body && body.rendered && body.rendered.content) return String(body.rendered.content);
      }
    } catch {
      // not JSON — ignore
    }
    // Fallback: return raw text/html
    return text;
  },
};
