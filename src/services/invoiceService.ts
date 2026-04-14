import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from './api';
import type { ApiInvoice, BatchInvoiceResult, CreateInvoicePayload, Pagination } from '../types/api';

export interface ListInvoicesParams {
  inviteeId?: number;
  eventId?: number;
  status?: 'paid' | 'unpaid' | 'cancelled';
  page?: number;
  pageSize?: number;
  sortBy?: 'id' | 'invoiceNumber' | 'status' | 'createdAt';
  sortDir?: 'ASC' | 'DESC';
}

export const invoiceService = {
  getAll(params?: ListInvoicesParams): Promise<{ invoices: ApiInvoice[]; pagination: Pagination }> {
    return apiGet('/invoices', params as Record<string, string | number | boolean | undefined>);
  },

  getById(id: number): Promise<{ invoice: ApiInvoice }> {
    return apiGet(`/invoices/${id}`);
  },

  getByInvitee(inviteeId: number): Promise<{ invoice: ApiInvoice }> {
    return apiGet(`/invoices/by-invitee/${inviteeId}`);
  },

  create(payload: CreateInvoicePayload, idempotencyKey?: string): Promise<{ invoice: ApiInvoice }> {
    return apiPost('/invoices', payload, idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined);
  },

  createBatch(items: CreateInvoicePayload[]): Promise<{ results: BatchInvoiceResult[] }> {
    return apiPost('/invoices/batch', { items });
  },

  replace(
    id: number,
    payload: CreateInvoicePayload & {
      invoiceNumber: string;
      status?: string;
    },
  ): Promise<{ invoice: ApiInvoice }> {
    return apiPut(`/invoices/${id}`, payload);
  },

  update(
    id: number,
    payload: Partial<CreateInvoicePayload & { invoiceNumber: string; status: string }>,
  ): Promise<{ invoice: ApiInvoice }> {
    return apiPatch(`/invoices/${id}`, payload);
  },

  updateStatus(
    id: number,
    status: 'paid' | 'unpaid' | 'cancelled',
  ): Promise<{ invoice: ApiInvoice }> {
    return apiPatch(`/invoices/${id}/status`, { status });
  },

  delete(id: number): Promise<{ success: boolean }> {
    return apiDelete(`/invoices/${id}`);
  },
};
