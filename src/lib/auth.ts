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

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        email: true, 
        role: true,
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        idVerified: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export function generateMagicToken(email: string): string {
  const payload = {
    email,
    type: 'magic-link',
    exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
  };
  return jwt.sign(payload, getJwtSecret());
}

export function verifyMagicToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      email: string;
      type: string;
    };
    
    if (decoded.type !== 'magic-link') {
      return null;
    }
    
    return { email: decoded.email };
  } catch (error) {
    console.error('Error verifying magic token:', error);
    return null;
  }
}

export async function findOrCreateUser(email: string, role: string = 'tenant') {
  try {
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: role as 'tenant' | 'host' | 'admin'
        }
      });
    }

    return user;
  } catch (error) {
    console.error('Error finding or creating user:', error);
    throw error;
  }
}

export function createSessionToken(user: { id: string; email: string; role: string }): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
  };
  return jwt.sign(payload, getJwtSecret());
}

export function generateEmailVerificationToken(email: string): string {
  const payload = {
    email,
    type: 'email-verification',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  return jwt.sign(payload, getJwtSecret());
}

export function verifyEmailVerificationToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      email: string;
      type: string;
    };
    
    if (decoded.type !== 'email-verification') {
      return null;
    }
    
    return { email: decoded.email };
  } catch (error) {
    console.error('Error verifying email verification token:', error);
    return null;
  }
}
