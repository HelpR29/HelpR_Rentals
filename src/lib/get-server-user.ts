import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  email: string;
  role: 'tenant' | 'host' | 'admin';
}

export async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  console.log('Auth Token from cookie:', token ? 'Found' : 'Not Found');

  if (!token) {
    console.log('No token, returning null.');
    return null;
  }

  console.log('JWT_SECRET available:', process.env.JWT_SECRET ? 'Yes' : 'No');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    console.log('Token verification failed, returning null.');
    return null;
  }
}
