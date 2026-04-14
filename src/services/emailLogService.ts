import { API_BASE, apiDelete, apiGet, apiPost, apiPut } from './api';
import { TOKEN_STORAGE_KEY } from '../config/constants';
import type { ApiEmailLog, Pagination } from '../types/api';

export interface ListEmailLogsParams {
  eventId?: number;
  inviteeId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface ExportEmailLogsParams {
  format?: 'csv' | 'json';
  eventId?: number;
  inviteeId?: number;
  from?: string;
  to?: string;
}

export const emailLogService = {
  getAll(params?: ListEmailLogsParams): Promise<{ emailLogs: ApiEmailLog[]; pagination: Pagination }> {
    return apiGet('/email-logs', params as Record<string, string | number | boolean | undefined>);
  },

  getById(id: number): Promise<{ emailLog: ApiEmailLog }> {
    return apiGet(`/email-logs/${id}`);
  },

  /** Returns JSON logs when format is 'json'. CSV export should use a direct download URL. */
  exportJson(params?: ExportEmailLogsParams): Promise<{ emailLogs: ApiEmailLog[] }> {
    return apiGet('/email-logs/export', {
      admin: true,
      format: 'json',
      ...(params as Record<string, string | number | boolean | undefined>),
    });
  },

  /** Returns the URL for a CSV export download (to be used as an anchor href). */
  getCsvExportUrl(params?: Omit<ExportEmailLogsParams, 'format'>): string {
    const url = new URL(`${API_BASE}/email-logs/export`);
    url.searchParams.set('admin', 'true');
    url.searchParams.set('format', 'csv');
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) url.searchParams.set('token', token);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  },

  create(payload: {
    eventId: number;
    to: string;
    subject: string;
    body: string;
    inviteeId?: number;
    timestamp?: string;
  }): Promise<{ emailLog: ApiEmailLog }> {
    return apiPost('/email-logs', payload);
  },

  sendReminder(payload: {
    inviteeIds: number[];
    template?: string;
    sendImmediately?: boolean;
  }): Promise<{ success: boolean; queuedCount: number; emailLogIds: number[] }> {
    return apiPost('/email-logs/send-reminder', payload);
  },

  update(id: number, payload: { subject?: string; body?: string }): Promise<{ emailLog: ApiEmailLog }> {
    return apiPut(`/email-logs/${id}`, payload);
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/email-logs/${id}`);
  },
};
