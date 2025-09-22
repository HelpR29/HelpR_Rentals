export const dynamic = 'force-dynamic';

import ListingBrowser from '@/components/listings/ListingBrowser';
import { getServerUser } from '@/lib/get-server-user';
import Link from 'next/link';

export default async function BrowsePage() {
  const user = await getServerUser();

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {user ? (
          // If user is logged in, show full listing browser
          <ListingBrowser />
        ) : (
          // If not logged in, show blurred listings with sign-up overlay
          <div className="relative">
            {/* Blurred Background Listings */}
            <div className="filter blur-sm pointer-events-none">
              <ListingBrowser />
            </div>
            
            {/* Sign-up Overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-3.586l4.293-4.293A6 6 0 0116 6z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🏠 Discover Amazing Rentals
                  </h2>
                  <p className="text-gray-600">
                    Sign up to access verified listings in <strong className="text-red-600">Winnipeg</strong> with AI-powered neighborhood insights.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href="/auth/login?role=tenant" className="block w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    🔍 I'm Looking for a Place
                  </Link>
                  <Link href="/auth/login?role=host" className="block w-full px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    🏡 I'm Hosting My Place
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">100%</div>
                      <div className="text-xs text-gray-500">AI-Verified</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">24/7</div>
                      <div className="text-xs text-gray-500">Support</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">🇨🇦</div>
                      <div className="text-xs text-gray-500">Canadian</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
