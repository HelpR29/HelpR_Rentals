import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface UserPayload {
  id: string;
  email: string;
  role: 'tenant' | 'host' | 'admin';
}

export async function getServerUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not defined in the environment variables');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as UserPayload;
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}
