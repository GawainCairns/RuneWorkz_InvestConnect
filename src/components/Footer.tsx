export default function Footer() {
  return (
    <footer className="bg-white text-gray-500 py-6 shadow-[0_-8px_24px_rgba(15,23,42,0.14)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <img src="/investconnect-logo.png" alt="InvestConnect" className="h-[60px] w-auto" />
        <span className="text-sm">&copy; {new Date().getFullYear()} InvestConnect. All rights reserved.</span>
      </div>
    </footer>
  );
}
