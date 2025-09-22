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
          // Enhanced Hero Landing Page
          <div className="relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
              <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
            </div>

            {/* Hero Section */}
            <div className="text-center mb-20 relative">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-semibold mb-8 shadow-lg animate-bounce">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                🇨🇦 Launching in Winnipeg • AI-Powered Smart Matching
              </div>
              
              <h1 className="text-6xl font-bold text-gray-900 sm:text-7xl md:text-8xl leading-tight mb-6 animate-fade-in">
                Find Your Perfect
                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                  Rental Home
                </span>
              </h1>
              
              <p className="mt-8 max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed animate-fade-in-delay">
                🏠 Connect with trusted hosts and verified renters in <strong>Winnipeg</strong>. Our AI ensures safe, quality listings with intelligent neighborhood insights for your perfect home.
              </p>

              {/* CTA Buttons */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delay-2">
                <a href="/auth/login?role=tenant" className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  <span className="relative z-10">🔍 I'm Looking for a Place</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </a>
                <a href="/auth/login?role=host" className="group px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-indigo-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  🏡 I'm Hosting My Place
                </a>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="group flex flex-col items-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-slide-up">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🛡️ AI-Verified Safe</h3>
                <p className="text-gray-600 text-center leading-relaxed">Smart scam detection and listing verification powered by advanced AI algorithms</p>
              </div>

              <div className="group flex flex-col items-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-slide-up-delay">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">⚡ Instant Matching</h3>
                <p className="text-gray-600 text-center leading-relaxed">AI-powered smart matching with perfect hosts based on your preferences and lifestyle</p>
              </div>

              <div className="group flex flex-col items-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/50 shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-slide-up-delay-2">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">🏙️ Neighborhood Insights</h3>
                <p className="text-gray-600 text-center leading-relaxed">AI-powered neighborhood analysis with real data about Winnipeg's best areas</p>
              </div>
            </div>

            {/* Winnipeg Showcase */}
            <div className="mt-24 text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                🍁 Starting in Beautiful <span className="text-red-600">Winnipeg</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
                From the historic Exchange District to trendy Osborne Village, discover your perfect home in Manitoba's vibrant capital city.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <div className="bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl mb-4">🏛️</div>
                  <h3 className="font-bold text-lg mb-2">Exchange District</h3>
                  <p className="text-gray-600 text-sm">Historic charm meets modern living</p>
                </div>
                <div className="bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl mb-4">🌊</div>
                  <h3 className="font-bold text-lg mb-2">Osborne Village</h3>
                  <p className="text-gray-600 text-sm">Canada's most densely populated neighborhood</p>
                </div>
                <div className="bg-white/90 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl mb-4">🍝</div>
                  <h3 className="font-bold text-lg mb-2">Corydon Avenue</h3>
                  <p className="text-gray-600 text-sm">Little Italy with authentic charm</p>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
              
              <h2 className="text-3xl font-bold mb-8 relative z-10">Join the Future of Rental Housing</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div className="transform hover:scale-110 transition-transform duration-300">
                  <div className="text-4xl font-bold mb-2 animate-pulse">100%</div>
                  <div className="text-blue-100">AI-Verified Listings</div>
                </div>
                <div className="transform hover:scale-110 transition-transform duration-300">
                  <div className="text-4xl font-bold mb-2 animate-pulse">24/7</div>
                  <div className="text-blue-100">Smart Support</div>
                </div>
                <div className="transform hover:scale-110 transition-transform duration-300">
                  <div className="text-4xl font-bold mb-2">🇨🇦</div>
                  <div className="text-blue-100">Made in Canada</div>
                </div>
              </div>
              
              <div className="mt-8 relative z-10">
                <a href="/auth/login?role=tenant" className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-lg">
                  🚀 Get Started Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="fixed bottom-8 right-8 z-50">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl animate-bounce cursor-pointer hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
