import 'dotenv/config';
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }
  return secret;
}

export interface AuthUser {
  id: string
  email: string
  role: string
}

export async function generateMagicToken(email: string): Promise<string> {
    const token = jwt.sign(
    { email, type: 'magic-link' },
    getJwtSecret(),
    { expiresIn: '15m' }
  );
  return token
}

export async function verifyMagicToken(token: string): Promise<string | null> {
  try {
        const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (decoded.type === 'magic-link' && decoded.email) {
      return decoded.email
    }
    return null
  } catch {
    return null
  }
}

export async function createSessionToken(user: AuthUser): Promise<string> {
    const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
  return token
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
        const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) return null
  
  return verifySessionToken(token)
}

export async function generateEmailVerificationToken(userId: string, email: string): Promise<string> {
    const token = jwt.sign(
    { userId, email, type: 'email-verification' },
    getJwtSecret(),
    { expiresIn: '1h' } // Verification link is valid for 1 hour
  );
  return token;
}

export async function verifyEmailVerificationToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
        const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (decoded.type === 'email-verification' && decoded.userId && decoded.email) {
            return { userId: decoded.userId as string, email: decoded.email as string };
    }
    return null;
  } catch {
    return null;
  }
}

export async function findOrCreateUser(email: string, role: string = 'tenant'): Promise<AuthUser> {
  let user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        role
      }
    })
  }
  
  return {
    id: user.id,
    email: user.email,
    role: user.role
  }
}
