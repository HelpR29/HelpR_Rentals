export default function AboutPage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-8">
            🇨🇦 Made in Canada
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight">
            About <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Helpr</span>
          </h1>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Canada's first AI-powered rental platform, starting in beautiful <strong className="text-red-600 animate-pulse">Winnipeg</strong>.
          </p>
        </div>

        {/* Mission & Vision Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-8">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">🛡️ Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              We're revolutionizing the rental market by using AI to create safer, smarter connections between hosts and tenants. Our platform eliminates scams, provides neighborhood insights, and ensures quality matches for everyone.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mb-8">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">🏙️ Why Winnipeg?</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Starting in Manitoba's vibrant capital, we're building a platform that understands Canadian rental needs. From the historic Exchange District to trendy Osborne Village, we know Winnipeg's unique neighborhoods.
            </p>
          </div>
        </div>

        {/* Features Highlight */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 mb-24 text-white text-center">
          <h2 className="text-3xl font-bold mb-8">What Makes Us Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-xl font-semibold mb-2">AI-Verified Safe</div>
              <div className="text-blue-100">Every listing verified by AI</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold mb-2">⚡</div>
              <div className="text-xl font-semibold mb-2">Instant Matching</div>
              <div className="text-blue-100">Smart AI connects perfect matches</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold mb-2">🏙️</div>
              <div className="text-xl font-semibold mb-2">Local Insights</div>
              <div className="text-blue-100">Real neighborhood data & analysis</div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white/90 rounded-3xl p-12 shadow-xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">🚀 Coming Soon</h2>
            <p className="text-xl text-gray-600">Exciting features on the horizon</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                <div className="text-4xl">📍</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">More Cities</h3>
              <p className="text-gray-600 leading-relaxed">Expanding across Canada to serve more communities with our AI-powered platform</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                <div className="text-4xl">🤖</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Enhanced AI</h3>
              <p className="text-gray-600 leading-relaxed">Smarter matching algorithms and even better scam detection capabilities</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-6 transition-transform duration-300">
                <div className="text-4xl">📱</div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mobile App</h3>
              <p className="text-gray-600 leading-relaxed">Native iOS and Android apps for the best mobile rental experience</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the future of rental housing in Winnipeg
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/login?role=tenant" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              🔍 I'm Looking for a Place
            </a>
            <a href="/auth/login?role=host" className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl border-2 border-gray-200 hover:border-indigo-300 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
              🏡 I'm Hosting My Place
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
