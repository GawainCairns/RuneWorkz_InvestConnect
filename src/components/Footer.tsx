export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span className="text-sm font-medium text-white">InvestConnect</span>
        <span className="text-sm">&copy; {new Date().getFullYear()} InvestConnect. All rights reserved.</span>
      </div>
    </footer>
  );
}
