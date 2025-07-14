import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Iwata Project</h3>
          <p className="text-sm">AI Japanese video generation made simple.</p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Product</h4>
          <ul className="space-y-1 text-sm">
            <li><Link href="/generate" className="hover:text-white">Generator</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/api" className="hover:text-white">API</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Company</h4>
          <ul className="space-y-1 text-sm">
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-2">Legal</h4>
          <ul className="space-y-1 text-sm">
            <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-sm">© 2024 Iwata Project</div>
    </footer>
  );
} 