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
  async getEmailPreview(eventId: number): Promise<string> {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const headers: Record<string, string> = {
      Accept: 'text/html',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const url = `${API_BASE}/email/invite/preview/${eventId}`;
    const res = await fetch(url, { method: 'POST', headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch email preview: ${res.statusText}`);
    }
    const text = await res.text();

    const escapeHtml = (str: string) =>
      str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const transformPlainToHtml = (raw: string) => {
      // Normalize newlines
      const normalized = raw.replace(/\r\n/g, '\n');
      // Escape all HTML, then convert markdown links to anchors
      let escaped = escapeHtml(normalized);
      escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
        const t = escapeHtml(String(text));
        const u = String(url).replace(/"/g, '%22');
        return `<a href="${u}">${t}</a>`;
      });
      // Convert newlines to <br/>
      return escaped.replace(/\n/g, '<br/>');
    };

    // Try to parse JSON responses even if content-type isn't accurate
    try {
      const body = JSON.parse(text);
      const pick = (b: any): string | null => {
        if (!b) return null;
        if (typeof b === 'string') return b;
        if (b.html) return b.html;
        if (b.rendered && b.rendered.content) return b.rendered.content;
        if (b.result && b.result.data && b.result.data.htmlBody) return b.result.data.htmlBody;
        if (b.data && b.data.htmlBody) return b.data.htmlBody;
        if (b.htmlBody) return b.htmlBody;
        return null;
      };

      const candidate = pick(body) || pick(body.result) || pick(body.result?.data) || pick(body.data);
      if (candidate) {
        // If candidate looks like HTML, return as-is; otherwise transform plaintext
        if (/<[^>]+>/.test(candidate)) return String(candidate);
        return transformPlainToHtml(String(candidate));
      }
    } catch {
      // not JSON — ignore
    }

    // If the server accidentally appends JSON after the HTML, strip it out.
    // Match everything up to the last closing </html> or </body> tag (case-insensitive).
    try {
      const htmlMatch = text.match(/([\s\S]*<\/(?:html|body)>)/i);
      if (htmlMatch && htmlMatch[1]) {
        return htmlMatch[1];
      }
    } catch {
      // ignore regex errors and fallthrough to return raw text
    }

    // Fallback: transform raw text into safe HTML
    return transformPlainToHtml(text);
  },
};
