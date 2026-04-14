export const DIETARY_OPTIONS = [
  'No restrictions',
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Halal',
  'Kosher',
  'Nut allergy',
  'Other',
];

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}${month}-${rand}`;
}

export function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventTime(timeStr: string): string {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function buildGoogleCalendarUrl(event: {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string;
}): string {
  const startDate = event.date.replace(/-/g, '');
  const [sh, sm] = event.start_time.split(':');
  const [eh, em] = event.end_time.split(':');
  const start = `${startDate}T${sh}${sm}00`;
  const end = `${startDate}T${eh}${em}00`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    location: event.location,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
