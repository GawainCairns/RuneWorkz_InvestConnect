# Attendee Flow

This page documents the attendee-facing multi-step flow and ties each step to the source components so maintainers can quickly find behaviour and UI details.

## 1 — InvitationLanding
- Purpose: Entry page for an invite link; shows event hero, title, date, location, price and description.
- Look: gradient hero header, icon rows for date/location/price, simple confirm-details form, uses `Header` and `Footer`.
- Component: src/components/attendee/InvitationLanding.tsx

## 2 — RSVPPage
- Purpose: Ask if the invitee will attend (Yes / No).
- Look: centered card with two large action buttons (icons + labels), event metadata and footer details.
- Component: src/components/attendee/RSVPPage.tsx

## 3 — DietaryPage
- Purpose: Capture dietary requirements for attending guests.
- Look: stacked selectable full-width option buttons; selected option displays an indicator.
- Component: src/components/attendee/DietaryPage.tsx

## 4 — PaymentPage
- Purpose: Choose payment method — pay now or request an invoice.
- Look: amount-due card, two selectable payment method blocks with icons, prominent continue button, step indicator.
- Component: src/components/attendee/PaymentPage.tsx

## 5 — InvoiceForm
- Purpose: Collect billing details, generate invoice, attach it to invitee and log/send an invoice email.
- Look: standard form fields (`FormField`), amount-due box and `Generate Invoice` primary action.
- Component: src/components/attendee/InvoiceForm.tsx

## 6 — ConfirmationPage
- Purpose: Final screen after RSVP/payment; confirms attendee status and payment.
- Look: success badge, event details panel, payment status pill, prominent `Add to Calendar` button.
- Component: src/components/attendee/ConfirmationPage.tsx

---

Notes:
- Typical flow: InvitationLanding → RSVPPage → (if Yes) DietaryPage → PaymentPage → (InvoiceForm if requested) → ConfirmationPage.

If you'd like, I can also add quick links from the project README or create a `docs/index.md` to surface this page.
