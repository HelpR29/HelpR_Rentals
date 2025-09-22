export const dynamic = 'force-dynamic'; // THIS IS THE FIX

import ListingBrowser from '@/components/listings/ListingBrowser';
import { getServerUser } from '@/lib/get-server-user';

export default async function Home() {
  const user = await getServerUser();
  
  return (
    <>
      {/* Force full page reload after login */}
      <script dangerouslySetInnerHTML={{
        __html: `
          if (window.location.search.includes('refresh=true')) {
            window.location.href = '/';
          }
        `
      }} />
      
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {user ? (
          // If ANY user is logged in, show the listing browser.
          <ListingBrowser />
        ) : (
          // Improved Hero Landing Page - Keep energy but reduce noise
          <div className="relative overflow-hidden">
            {/* Refined Background Elements - Less overwhelming */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/4 w-80 h-80 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
              <div className="absolute top-0 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-16 relative">
              <div className="inline-flex items-center px-5 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
                🇨🇦 Launching in Winnipeg • AI-Powered
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl md:text-7xl leading-tight mb-6">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Rental Home
                </span>
              </h1>
              
              <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
                Connect with trusted hosts and verified renters in <strong>Winnipeg</strong>. Our AI ensures safe, quality listings with intelligent neighborhood insights.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="/auth/login?role=tenant" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  🔍 I'm Looking for a Place
                </a>
                <a href="/auth/login?role=host" className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-indigo-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  🏡 I'm Hosting My Place
                </a>
              </div>
            </div>

            {/* Features Grid - Cleaner but still engaging */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="flex flex-col items-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">🛡️ AI-Verified Safe</h3>
                <p className="text-gray-600 text-center text-sm">Smart scam detection and listing verification</p>
              </div>

              <div className="flex flex-col items-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">⚡ Instant Matching</h3>
                <p className="text-gray-600 text-center text-sm">AI-powered smart matching with perfect hosts</p>
              </div>

              <div className="flex flex-col items-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">🏙️ Neighborhood Insights</h3>
                <p className="text-gray-600 text-center text-sm">AI-powered analysis of Winnipeg's best areas</p>
              </div>
            </div>

            {/* Winnipeg Showcase - Simplified */}
            <div className="mt-20 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🍁 Starting in Beautiful <span className="text-red-600">Winnipeg</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                From the historic Exchange District to trendy Osborne Village, discover your perfect home in Manitoba's vibrant capital.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="bg-white/90 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl mb-3">🏛️</div>
                  <h3 className="font-bold mb-1">Exchange District</h3>
                  <p className="text-gray-600 text-sm">Historic charm meets modern living</p>
                </div>
                <div className="bg-white/90 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl mb-3">🌊</div>
                  <h3 className="font-bold mb-1">Osborne Village</h3>
                  <p className="text-gray-600 text-sm">Canada's most densely populated neighborhood</p>
                </div>
                <div className="bg-white/90 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300">
                  <div className="text-3xl mb-3">🍝</div>
                  <h3 className="font-bold mb-1">Corydon Avenue</h3>
                  <p className="text-gray-600 text-sm">Little Italy with authentic charm</p>
                </div>
              </div>
            </div>

            {/* Final CTA Section - Streamlined */}
            <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 text-white text-center">
              <h2 className="text-2xl font-bold mb-6">Ready to Find Your Perfect Home?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <div className="text-3xl font-bold mb-1">100%</div>
                  <div className="text-blue-100 text-sm">AI-Verified Listings</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">24/7</div>
                  <div className="text-blue-100 text-sm">Smart Support</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">🇨🇦</div>
                  <div className="text-blue-100 text-sm">Made in Canada</div>
                </div>
              </div>
              
              <a href="/auth/login?role=tenant" className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-lg">
                🚀 Get Started Now
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
