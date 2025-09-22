'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import VerificationBadge from '@/components/ui/VerificationBadge';
import { useUser } from '@/hooks/useUser'; // Import the new hook

// Simplified User interface for the header
interface HeaderUser {
  id: string;
  email: string;
  role: string;
  avatar?: string | null;
  verified?: boolean;
}

export default function Header() {
  const { user, loading, logout, fetchUser } = useUser();

  // Listen for login events to refresh user data
  useEffect(() => {
    const handleUserLoggedIn = () => {
      console.log('🔄 Header received userLoggedIn event, refreshing...');
      fetchUser();
    };

    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    return () => window.removeEventListener('userLoggedIn', handleUserLoggedIn);
  }, [fetchUser]);

  // Cast the user from the hook to the more detailed HeaderUser type
  const headerUser = user as HeaderUser | null;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Helpr</h1>
                <p className="text-xs text-gray-500 -mt-1">Smart Rentals</p>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">Home</Link>
            <Link href="/browse" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">Browse</Link>
            
            {!headerUser && (
              <>
                <Link href="/auth/login?role=host" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">Host</Link>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">About</Link>
              </>
            )}
            
            {headerUser?.role === 'host' && (
              <Link href="/post" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Post Listing
              </Link>
            )}
            {headerUser && (
              <>
                <Link href="/inbox" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium">Inbox</Link>
                <Link href="/verification" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium">Verification</Link>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium">Privacy</Link>
                <Link href="/notifications" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium">🔔</Link>
              </>
            )}
            {headerUser?.role === 'admin' && (
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium">Admin</Link>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
            ) : headerUser ? (
              <div className="flex items-center space-x-3">
                <Link href={`/profile/${headerUser.id}`} className="hidden sm:block">
                  <div className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                    {headerUser.avatar ? (
                      <img src={headerUser.avatar} alt={headerUser.email} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">{headerUser.email.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <p className="text-gray-900 font-medium">{headerUser.email.split('@')[0]}</p>
                      <p className="text-gray-500 text-xs capitalize">{headerUser.role}</p>
                    </div>
                  </div>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout} className="text-gray-600 hover:text-gray-900">Logout</Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login?role=tenant"><Button variant="ghost" size="sm">I'm Looking</Button></Link>
                <Link href="/auth/login?role=host"><Button size="sm">I'm Hosting</Button></Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
