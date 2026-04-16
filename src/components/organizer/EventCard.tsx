import { Calendar, Clock, DollarSign, MapPin, Users } from 'lucide-react';
import type { Event } from '../../types/organizer';

interface EventCardProps {
  event: Event;
  inviteeCount?: number;
  confirmedCount?: number;
  paidCount?: number;
  showStats?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function isPastEvent(dateStr: string) {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

export default function EventCard({
  event,
  inviteeCount = 0,
  confirmedCount = 0,
  paidCount = 0,
  showStats,
  onClick,
  selected = false,
}: EventCardProps) {
  const past = isPastEvent(event.date);
  const shouldShowStats = typeof showStats === 'boolean' ? showStats : !past;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
        selected
          ? 'border-brand-500 shadow-md ring-2 ring-brand-200'
          : 'border-slate-200 hover:border-brand-300'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="inline-block text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full mb-2">
              {event.brand}
            </span>
            <h3 className="text-base font-semibold text-slate-900 leading-tight">{event.title}</h3>
          </div>
          {event.price > 0 && (
            <div className="flex items-center gap-1 text-sm font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
              <DollarSign className="w-3.5 h-3.5" />
              {event.price.toFixed(0)}
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">{event.description}</p>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {formatTime(event.start_time)} – {formatTime(event.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>
      </div>

      {shouldShowStats && (
        <div className="border-t border-slate-100 grid grid-cols-3 divide-x divide-slate-100">
          <div className="px-4 py-3 text-center">
            <div className="text-lg font-bold text-slate-900">{inviteeCount}</div>
            <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Invited
            </div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-lg font-bold text-emerald-600">{confirmedCount}</div>
            <div className="text-xs text-slate-500">Confirmed</div>
          </div>
          <div className="px-4 py-3 text-center">
            <div className="text-lg font-bold text-brand-600">{paidCount}</div>
            <div className="text-xs text-slate-500">Paid</div>
          </div>
        </div>
      )}
    </div>
  );
}
