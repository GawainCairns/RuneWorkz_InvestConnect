# Admin Flow

This document outlines the organizer/admin workflow and maps each step to the source components so maintainers can quickly locate logic and UI.

## Overview
- Entry: Admin area is routed under the admin layout which provides `Header`, `Footer`, and a content `Outlet`.
- Typical flow: Sign in → Admin Dashboard → Events list → Create/Edit Event → Event Details → Manage Invitees → Send/Preview Emails → View Email Logs.

## 1 — AdminLayout
- Role: Global wrapper for admin routes. Ensures consistent header/footer and page container.

## 2 — AdminDashboard
- Role: Overview of metrics (total events, invitees, confirmed, paid), quick actions (create event, view events), and small event previews (`EventCard`).
- Navigation: Quick CTA to `/admin/events/new` and links to event details.

## 3 — EventList & EventCard
- Role: Browse events split into upcoming/past sections. `EventCard` provides a clickable summary (brand, title, date/time, price, invited/confirmed/paid counts).
- Navigation: Click card → `/admin/events/:id` (EventDetails).

## 4 — EventForm / EventEditForm
- Role: Create or edit event data (brand, title, description, date, times, location, capacity, price).
- Behavior: Validates inputs, calls `createEvent`/`updateEvent`, then redirects to event email editor or details.

## 5 — EventDetails
- Role: Central hub for an event — summary, stats, and tabs for `Invitees` and `Emails`.
- Key actions: export PDFs (`exportInviteesToPDF`, `exportAttendanceToPDF`), navigate to manage invitees, preview email templates, edit invite email template.

## 6 — Invitee Management
- Role: Add single invitees, bulk upload CSV (with validation and formula-injection guard), view and manage invitee statuses, copy invite link, resend invitation (creates email log), and mark paid.

## 7 — Invitee Dashboard (non-admin)
- Role: Self-service dashboard for signed-in users to see invites tied to their email and quick links to RSVP flows.

## 8 — Email Templates & Logs
- Role: Edit per-event email templates (pre/post text, catering, parking) with live preview. View event-scoped and global email logs with details and previews.

## 9 — Supporting UI
- `EmailLogTable` shows a two-column list + detail pane for selected email.
- `DataTable` and `FormField` (in `src/components/ui`) are used across admin pages for consistent tables and input styling.

---

Navigation quick-map (URLs):
- `/admin` → Admin dashboard 
- `/admin/events` → Events list
- `/admin/events/new` → Create event
- `/admin/events/:id` → Event details 
- `/admin/events/:id/edit` → Edit event
- `/admin/events/:id/invitees` → Manage invitees 
- `/admin/events/:id/emails` → Event email logs
- `/admin/email-logs` → All email logs
