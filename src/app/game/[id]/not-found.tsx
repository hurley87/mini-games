import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-3xl font-bold mb-4">Game Not Found</h2>
      <p className="text-gray-600 mb-8">The game you're looking for doesn't exist or has been removed.</p>
      <Link 
        href="/"
        className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
} 