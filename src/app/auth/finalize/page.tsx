'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FinalizeLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get the final destination from the URL query parameters
    const redirectTo = searchParams.get('redirectTo') || '/';

    // Dispatch the event to tell the header to update
    console.log('🚀 Finalizing login, dispatching userLoggedIn event...');
    window.dispatchEvent(new CustomEvent('userLoggedIn'));

    // A short delay to ensure the event is processed before redirecting
    setTimeout(() => {
      console.log(`Redirecting to ${redirectTo}...`);
      router.push(redirectTo);
    }, 50); // 50ms delay

  }, [router, searchParams]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <p>Finalizing login...</p>
    </div>
  );
}
