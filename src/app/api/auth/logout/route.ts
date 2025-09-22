import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Create a response to redirect to the homepage
    const response = NextResponse.redirect(new URL('/', request.url), {
      status: 302, // Use a temporary redirect
    });

    // On that response, tell the browser to delete the session cookie
    response.cookies.set({
      name: 'session',
      value: '',
      path: '/',
      expires: new Date(0), // Set expiry to the past to delete it
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
