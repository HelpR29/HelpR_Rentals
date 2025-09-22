export const dynamic = 'force-dynamic'; // THIS IS THE FIX

import ListingBrowser from '@/components/listings/ListingBrowser';
import { getServerUser } from '@/lib/get-server-user';

export default async function Home() {
  const user = await getServerUser();
  
  // EMERGENCY DEBUG LOGGING
  console.log('🚨 HOMEPAGE DEBUG:');
  console.log('🚨 User object:', JSON.stringify(user, null, 2));
  console.log('🚨 User exists?', !!user);
  console.log('🚨 User role:', user?.role);
  console.log('🚨 Should show ListingBrowser?', !!user);
  console.log('🚨 Should show Hero?', !user);
  
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {user ? (
          // If ANY user is logged in, show the listing browser.
          <ListingBrowser />
        ) : (
          // If NO user is logged in, show ONLY the hero marketing page.
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            </div>
            <div className="relative">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI-Powered Smart Matching
              </div>
              <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl md:text-7xl leading-tight">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Rental</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
                Connect with trusted hosts and verified renters. Our AI ensures safe, quality listings with intelligent matching for your perfect home.
              </p>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                  <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Verified Safe</h3>
                    <p className="text-gray-600 text-center text-sm">Smart scam detection and listing verification</p>
                  </div>
                  <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Matching</h3>
                    <p className="text-gray-600 text-center text-sm">AI-powered smart matching with perfect hosts</p>
                  </div>
                  <div className="flex flex-col items-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Communication</h3>
                    <p className="text-gray-600 text-center text-sm">Built-in messaging and application system</p>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
