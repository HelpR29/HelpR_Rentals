'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TestLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const loginAsTenant = async () => {
    setLoading(true);
    try {
      // Direct API call to authenticate
      const response = await fetch('/api/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlbmFudEB0ZXN0LmNvbSIsInR5cGUiOiJtYWdpYy1saW5rIiwiZXhwIjoxNzU4NjYxNDk1LCJpYXQiOjE3NTg2NjA1OTV9.IQ4QPy7X8XkSL70_XyL5Hkx1Xqf6zIHJl54Ufi531cQ&role=tenant', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        // Force a page reload to update authentication state
        window.location.href = '/';
      } else {
        alert('Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error: ' + error);
    }
    setLoading(false);
  };

  const loginAsHost = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imhvc3RAdGVzdC5jb20iLCJ0eXBlIjoibWFnaWMtbGluayIsImV4cCI6MTc1ODY2MTQ5NSwiaWF0IjoxNzU4NjYwNTk1fQ.hGtlW8Gn11rYom_qL38XeyXZ4S_d6G9TWDf5s9pHSU4&role=host', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/post';
      } else {
        alert('Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error: ' + error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Test Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Click a button to test authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <button
              onClick={loginAsTenant}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login as Tenant'}
            </button>
            
            <button
              onClick={loginAsHost}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login as Host'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
