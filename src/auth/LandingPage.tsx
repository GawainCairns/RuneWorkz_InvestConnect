import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex flex-col flex-1">
        <section className="relative px-5 py-20 overflow-hidden sm:px-8 sm:py-28 bg-gradient-to-br from-brand-50 via-white to-accent-50">
          <div className="absolute rounded-full pointer-events-none -top-32 -right-24 h-96 w-96 bg-brand-100/50 blur-3xl" />
          <div className="relative max-w-4xl mx-auto text-center">
            <p className="mb-5 text-sm font-semibold tracking-wide uppercase text-brand-700">
              InvestConnect
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Creating connections in the asset management industry.
            </h1>
            <p className="max-w-2xl mx-auto mt-6 text-lg leading-relaxed text-slate-600">
              Bring professionals together through thoughtful events and meaningful conversations.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 mt-9 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full gap-2 px-6 py-3 text-sm font-semibold text-white transition-colors rounded-lg sm:w-auto bg-brand-600 hover:bg-brand-700"
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold transition-colors border rounded-lg sm:w-auto border-slate-300 text-slate-700 hover:bg-white"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                Good connections start with a conversation.
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                InvestConnect helps make those conversations easier to create and bring people together.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
