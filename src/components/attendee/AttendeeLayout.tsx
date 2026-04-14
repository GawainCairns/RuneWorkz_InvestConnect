import Footer from '../Footer';

interface AttendeeLayoutProps {
  children: React.ReactNode;
}

export default function AttendeeLayout({ children }: AttendeeLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
