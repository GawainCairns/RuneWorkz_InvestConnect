import {
  BarChart2,
  Bell,
  Calendar,
  ChevronRight,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import landingData from '../config/landing.json';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  Users,
  Bell,
  BarChart2,
  Shield,
  Zap,
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { hero, benefits, howItWorks, testimonials, cta } = landingData;

  const handleCTA = (action: string) => {
    navigate(action === 'register' ? '/register' : '/login');
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">InvestConnect</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent-100 text-accent-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-accent-500 rounded-full" />
            Event Management Reimagined
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight mb-6">
            {hero.headline}
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {hero.subheadline}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleCTA(hero.cta.primary.action)}
              className="flex items-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-brand-700 transition-all hover:shadow-lg hover:shadow-brand-200 w-full sm:w-auto"
            >
              {hero.cta.primary.label}
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleCTA(hero.cta.secondary.action)}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all w-full sm:w-auto"
            >
              {hero.cta.secondary.label}
            </button>
          </div>
        </div>
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 shadow-2xl shadow-brand-200">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { value: '500+', label: 'Events Created' },
                { value: '10k+', label: 'Invitations Sent' },
                { value: '98%', label: 'Satisfaction Rate' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="text-3xl font-semibold text-white mb-1">{stat.value}</div>
                  <div className="text-brand-200 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">{benefits.title}</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{benefits.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.items.map(item => {
              const Icon = iconMap[item.icon] || Calendar;
              return (
                <div
                  key={item.title}
                  className="group p-6 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-50 transition-all"
                >
                  <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">{howItWorks.title}</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">{howItWorks.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.steps.map((step, idx) => (
              <div key={step.step} className="relative text-center">
                {idx < howItWorks.steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] right-[calc(-50%+3rem)] h-px bg-gray-200" />
                )}
                <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-lg font-semibold shadow-lg shadow-brand-200">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-4">{testimonials.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.items.map(t => (
              <div key={t.name} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">{cta.title}</h2>
          <p className="text-brand-200 text-lg mb-8">{cta.subtitle}</p>
          <button
            onClick={() => handleCTA(cta.button.action)}
            className="inline-flex items-center gap-2 bg-accent-500 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-accent-600 transition-all hover:shadow-xl"
          >
            {cta.button.label}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-white">InvestConnect</span>
          </div>
          <span className="text-sm">&copy; {new Date().getFullYear()} InvestConnect. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
