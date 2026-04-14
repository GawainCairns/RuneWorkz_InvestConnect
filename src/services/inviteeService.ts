import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './api';
import type { ApiInvitee, BatchInviteeResult, CreateInviteePayload, Pagination } from '../types/api';

export interface ListInviteesParams {
  eventId?: number;
  email?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'name' | 'firstname' | 'surname' | 'email' | 'createdAt' | 'rsvpStatus' | 'paymentStatus';
  sortDir?: 'ASC' | 'DESC';
}

export const inviteeService = {
  getAll(params?: ListInviteesParams): Promise<{ invitees: ApiInvitee[]; pagination: Pagination }> {
    return apiGet('/invitees', params as Record<string, string | number | boolean | undefined>);
  },

  getById(id: number): Promise<{ invitee: ApiInvitee }> {
    return apiGet(`/invitees/${id}`);
  },

  getByCode(eventId: number, inviteCode: string): Promise<{ invitee: ApiInvitee }> {
    return apiGet(`/invitees/by-code/${eventId}/${inviteCode}`);
  },

  create(payload: CreateInviteePayload): Promise<{
    invitee: ApiInvitee;
    emailSubject: string;
    emailResult: Record<string, unknown>;
    emailError: string;
    emailErrorDetails: string;
  }> {
    return apiPost('/invitees', payload);
  },

  createBatch(items: CreateInviteePayload[]): Promise<{ results: BatchInviteeResult[] }> {
    return apiPost('/invitees/batch', { items });
  },

  replace(id: number, payload: CreateInviteePayload): Promise<{ invitee: ApiInvitee }> {
    return apiPut(`/invitees/${id}`, payload);
  },

  update(id: number, payload: Partial<CreateInviteePayload>): Promise<{ invitee: ApiInvitee }> {
    return apiPatch(`/invitees/${id}`, payload);
  },

  updateRsvp(
    id: number,
    payload: { rsvpStatus?: string; dietary?: string },
  ): Promise<{ invitee: ApiInvitee; emailSubject: string; emailResult: Record<string, unknown> }> {
    return apiPatch(`/invitees/${id}/rsvp`, payload);
  },

  updatePayment(
    id: number,
    paymentStatus: string,
  ): Promise<{ invitee: ApiInvitee }> {
    return apiPatch(`/invitees/${id}/payment`, { paymentStatus });
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/invitees/${id}`);
  },
};
