import { API_BASE, apiGet } from './api';
import type { Pagination, ReportInvitee } from '../types/api';
import { TOKEN_STORAGE_KEY } from '../config/constants';

export interface ReportInviteesParams {
  eventId?: number;
  status?: 'all' | 'confirmed' | 'pending' | string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'email' | 'paymentStatus' | 'id';
  sortDir?: 'ASC' | 'DESC';
}

export const reportService = {
  getInviteesReport(
    params?: ReportInviteesParams,
  ): Promise<{ invitees: ReportInvitee[]; pagination: Pagination }> {
    return apiGet('/reports/invitees-forms', params as Record<string, string | number | boolean | undefined>);
  },

  /** Returns the URL for a CSV report download (to be used as an anchor href). */
  getCsvReportUrl(params?: ReportInviteesParams): string {
    const url = new URL(`${API_BASE}/reports/invitees-forms.csv`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) url.searchParams.set('token', token);
    return url.toString();
  },
};
