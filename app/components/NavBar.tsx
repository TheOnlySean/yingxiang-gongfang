import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center text-white font-bold text-sm">
            IW
          </div>
          <span className="font-semibold text-lg text-gray-800">Iwata Project</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm text-gray-700">
          <Link href="/generate" className="hover:text-red-600 transition-colors">Generate</Link>
          <Link href="/history" className="hover:text-red-600 transition-colors">History</Link>
          <Link href="/pricing" className="hover:text-red-600 transition-colors">Pricing</Link>
        </nav>
        <div>
          <Link href="/login" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
} 