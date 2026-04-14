export interface Event {
  id: string;
  brand: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  price: number;
  capacity: number | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  number: string;
  entity_name: string;
  address: string;
  vat_number: string;
  contact_person: string;
  contact_email: string;
  amount: number;
  issued_at: string;
}

export interface Invitee {
  id: string;
  event_id: string;
  email: string;
  firstname: string;
  lastname: string;
  dietary: string;
  rsvp_status: 'pending' | 'confirmed' | 'declined';
  payment_status: 'unpaid' | 'paid' | 'invoice-issued';
  invite_token: string;
  invoice?: Invoice;
  created_at: string;
}

export interface EmailLog {
  id: string;
  event_id: string;
  invitee_id: string | null;
  to_email: string;
  subject: string;
  body: string;
  type: 'invite' | 'rsvp' | 'resend' | 'other';
  sent_at: string;
}

export interface EventProperties {
  event_id: string;
  pre_text: string;
  post_text: string;
  catering: string;
  parking: string;
}

export interface EventStats {
  total_invitees: number;
  confirmed: number;
  paid: number;
}
