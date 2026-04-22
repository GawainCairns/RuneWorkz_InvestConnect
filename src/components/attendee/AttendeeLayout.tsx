import Footer from '../Footer';

interface AttendeeLayoutProps {
  children: React.ReactNode;
}

export default function AttendeeLayout({ children }: AttendeeLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
