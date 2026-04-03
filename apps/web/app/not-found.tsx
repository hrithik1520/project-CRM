import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-7xl font-bold text-gray-200">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mt-4">Page not found</h1>
        <p className="text-sm text-gray-500 mt-2">The page you are looking for does not exist.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-6 px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
