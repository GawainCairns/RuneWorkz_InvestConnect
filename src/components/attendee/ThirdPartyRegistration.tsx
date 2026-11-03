import { Calendar, Check, ChevronDown, Clock, MapPin, Shield, TrendingUp, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventService, eventPropertyService } from '../../services/eventService';
import { inviteeService } from '../../services/inviteeService';
import { managerService } from '../../services/managerService';
import type { ApiEvent } from '../../types/api';
import { formatEventDate, formatEventTime } from '../../utils/attendee';
import AttendeeLayout from './AttendeeLayout';

const inputClass =
  'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors';

export default function ThirdPartyRegistration() {
  const { eventId: routeEventId, managerId: routeManagerId, code, managerCode } = useParams<{
    eventId?: string;
    managerId?: string;
    code?: string;
    managerCode?: string;
  }>();
  const navigate = useNavigate();
  const [resolvedEventId, setResolvedEventId] = useState<string | undefined>(routeEventId);
  const [resolvedManagerId, setResolvedManagerId] = useState<string | undefined>(routeManagerId);
  const eventId = routeEventId ?? resolvedEventId;
  const managerId = routeManagerId ?? resolvedManagerId;

  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEventInfo, setShowEventInfo] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    company: '',
  });
  const [consent, setConsent] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Links of the form /event/register/:code carry the third_party_link property value instead of the event id.
  useEffect(() => {
    if (routeEventId || !code) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    eventPropertyService
      .getAll()
      .then(res => {
        const match = res.eventsProperties.find(p => p.name === 'third_party_link' && p.value === code);
        if (!mounted) return;
        if (match) setResolvedEventId(String(match.eventId));
        else {
          setError('This registration link is invalid or no longer available.');
          setLoading(false);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError('This registration link is invalid or no longer available.');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [routeEventId, code]);

  // /event/reg/:managerCode carries a manager's third_party_link, which identifies both the manager and the event.
  useEffect(() => {
    if (!managerCode) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    managerService
      .getAll()
      .then(res => {
        const mgr = res.managers.find(m => m.thirdPartyLink === managerCode);
        if (!mounted) return;
        if (mgr) {
          setResolvedManagerId(String(mgr.id));
          setResolvedEventId(String(mgr.eventId));
        } else {
          setError('This registration link is invalid or no longer available.');
          setLoading(false);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setError('This registration link is invalid or no longer available.');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [managerCode]);

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    setError(null);

    const loadPromises: Promise<unknown>[] = [
      eventService.getById(Number(eventId)),
    ];

    if (managerId) {
      loadPromises.push(managerService.getById(Number(managerId)));
    }

    Promise.all(loadPromises)
      .then(([eventRes, managerRes]) => {
        const eventWithProps = (eventRes as { event: ApiEvent }).event;
        setEvent(eventWithProps);

        // Verify the third_party_link exists in event properties (when no manager)
        if (!managerId) {
          // eventWithProperties includes properties array
          const props = (eventWithProps as unknown as { properties?: { name: string; value: string }[] }).properties;
          const hasThirdParty = props?.some(p => p.name === 'third_party_link' && p.value);
          if (!hasThirdParty) {
            setError('This event does not have a third-party registration link.');
            return;
          }
        }

        if (managerRes) {
          const mgr = (managerRes as { manager: { name: string; thirdPartyLink: string } }).manager;
          setManagerName(mgr.name);
        }
      })
      .catch(() => setError('Event not found or no longer available.'))
      .finally(() => setLoading(false));
  }, [eventId, managerId]);

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.firstname.trim()) errs.firstname = 'First name is required';
    if (!form.lastname.trim()) errs.lastname = 'Last name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = 'A valid email is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const res = await inviteeService.create({
        eventId: Number(eventId),
        firstname: form.firstname.trim(),
        surname: form.lastname.trim(),
        email: consent ? form.email.trim() : null,
        company: form.company.trim() || undefined,
        managerId: managerId ? Number(managerId) : undefined,
        rsvpStatus: 'pending',
        paymentStatus: 'unpaid',
      });
      const inviteCode = (res as any).invitee?.inviteCode;
      if (inviteCode) {
        navigate(`/rsvp/${inviteCode}/respond`, { replace: true });
      } else {
        setError('Registration succeeded but we could not redirect you. Please contact the event organizer.');
      }
    } catch {
      setError('Unable to complete registration. Please try again or contact the event organizer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 rounded-full border-brand-600 border-t-transparent animate-spin" />
        </div>
      </AttendeeLayout>
    );
  }

  if (error || !event) {
    return (
      <AttendeeLayout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md text-center">
            <p className="text-lg font-semibold text-slate-900">{error ?? 'Event not found.'}</p>
            <p className="mt-2 text-sm text-slate-500">Please check your link and try again.</p>
          </div>
        </div>
      </AttendeeLayout>
    );
  }

  const isFree = event.price <= 0;

  const EventInfoPanel = (
    <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white rounded-2xl overflow-hidden shadow-xl">
      <div className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-white/15 rounded-lg backdrop-blur-sm">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase text-brand-200">
            You're invited
          </span>
        </div>

        <h1 className="text-2xl font-bold leading-tight mb-3">{event.title}</h1>
        {event.description && (
          <p className="text-sm leading-relaxed text-brand-100 mb-6">{event.description}</p>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-brand-200 shrink-0" />
            <span className="text-sm">{formatEventDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-brand-200 shrink-0" />
            <span className="text-sm">
              {formatEventTime(event.startTime)} – {formatEventTime(event.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-brand-200 shrink-0" />
            <span className="text-sm">{event.location}</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-brand-100">Ticket</span>
            {isFree ? (
              <span className="px-3 py-1 text-sm font-semibold bg-white/15 rounded-lg backdrop-blur-sm">
                Free
              </span>
            ) : (
              <span className="px-3 py-1 text-sm font-semibold bg-white/15 rounded-lg backdrop-blur-sm">
                R {event.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {managerName && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-brand-200">Referred by</p>
            <p className="text-sm font-semibold text-white">{managerName}</p>
          </div>
        )}
      </div>
    </div>
  );

  const RegistrationForm = (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-brand-100 rounded-lg shrink-0">
          <User className="w-5 h-5 text-brand-700" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Register to attend</h2>
          <p className="text-xs text-slate-500">Fill in your details to continue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Jane"
              value={form.firstname}
              onChange={e => update('firstname', e.target.value)}
            />
            {errors.firstname && <p className="mt-1 text-xs text-red-600">{errors.firstname}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Smith"
              value={form.lastname}
              onChange={e => update('lastname', e.target.value)}
            />
            {errors.lastname && <p className="mt-1 text-xs text-red-600">{errors.lastname}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input
            type="email"
            className={inputClass}
            placeholder="jane@example.com"
            value={form.email}
            onChange={e => update('email', e.target.value)}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
          <input
            type="text"
            className={inputClass}
            placeholder="Company name (optional)"
            value={form.company}
            onChange={e => update('company', e.target.value)}
          />
        </div>

        <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
          <button
            type="button"
            onClick={() => setConsent(prev => !prev)}
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              consent
                ? 'border-brand-600 bg-brand-600'
                : 'border-slate-300 bg-white hover:border-slate-400'
            }`}
          >
            {consent && <Check className="w-3.5 h-3.5 text-white" />}
          </button>
          <span className="text-sm leading-relaxed text-slate-600">
            I consent to receiving emails about this event, including updates and reminders.
          </span>
        </label>

        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <Shield className="w-4 h-4 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500">
            Your details are only used for this event and will not be shared with third parties.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 mt-2 font-semibold text-white transition-colors rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Registering...' : 'Continue to RSVP →'}
        </button>
      </form>
    </div>
  );

  return (
    <AttendeeLayout>
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
        {/* Mobile: collapsible event info toggle */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowEventInfo(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-brand-600" />
              Event details
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${showEventInfo ? 'rotate-180' : ''}`}
            />
          </button>
          {showEventInfo && (
            <div className="mt-3">
              {EventInfoPanel}
            </div>
          )}
        </div>

        {/* Desktop: two-column layout */}
        <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-5 lg:gap-8">
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-8">{EventInfoPanel}</div>
          </div>
          <div className="lg:col-span-3">{RegistrationForm}</div>
        </div>
      </div>
    </AttendeeLayout>
  );
}
