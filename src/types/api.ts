// ─── Shared ───────────────────────────────────────────────────────────────────

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
}

// ─── Brands ───────────────────────────────────────────────────────────────────

export interface Brand {
  id: number;
  name: string;
  description: string;
}

export interface BrandProperty {
  id: number;
  brandId: number;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface ApiEvent {
  id: number;
  brandId: number;
  title: string;
  description: string;
  date: string;
  location: string;
  price: number;
  capacity: number;
  btbTime: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEventWithProperties extends ApiEvent {
  properties: { id: number; name: string; value: string }[];
}

export interface ApiEventFull {
  event: ApiEvent;
  invitees: ApiInvitee[];
  invoices: ApiInvoice[];
  emailLogs: ApiEmailLog[];
}

export interface EventProperty {
  id: number;
  eventId: number;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Invitees ─────────────────────────────────────────────────────────────────

export interface ApiInvitee {
  id: number;
  eventId: number;
  inviteCode: string;
  firstname: string;
  surname: string;
  name: string;
  email: string;
  rsvpStatus: string;
  dietary: string | null;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInviteePayload {
  eventId: number;
  firstname: string;
  surname: string;
  email: string;
  rsvpStatus?: string;
  dietary?: string;
  paymentStatus?: string;
}

export interface BatchInviteeResult {
  success: boolean;
  invitee?: ApiInvitee;
  emailSubject?: string;
  emailResult?: Record<string, unknown>;
  error?: string;
  item?: CreateInviteePayload;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export interface ApiInvoice {
  id: number;
  inviteeId: number;
  invoiceNumber: string;
  status: 'paid' | 'unpaid' | 'cancelled';
  entityName: string;
  address: string;
  vatNumber: string | null;
  contactPerson: string;
  contactEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  inviteeId: number;
  entityName: string;
  address: string;
  contactPerson: string;
  contactEmail: string;
  vatNumber?: string;
}

export interface BatchInvoiceResult {
  success: boolean;
  invoice?: ApiInvoice;
  error?: string;
  item?: CreateInvoicePayload;
}

// ─── Email Logs ───────────────────────────────────────────────────────────────

export interface ApiEmailLog {
  id: number;
  eventId: number;
  inviteeId: number | null;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface ReportInvitee {
  id: number;
  name: string;
  email: string;
  rsvpStatus: string;
  dietary: string | null;
  paymentStatus: string;
  invoice: { invoiceNumber: string; status: string } | null;
  formCompleted: boolean;
  event: {
    id: number;
    title: string;
    btbTime: string;
    startTime: string;
    endTime: string;
  };
}
