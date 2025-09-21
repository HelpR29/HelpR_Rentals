import 'dotenv/config';
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

export interface AuthUser {
  id: string
  email: string
  role: string
}

export async function generateMagicToken(email: string): Promise<string> {
  const token = jwt.sign(
    { email, type: 'magic-link' },
    JWT_SECRET,
    { expiresIn: '15m' }
  )
  return token
}

export async function verifyMagicToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { type: string; email: string }
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
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  return token
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string }
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
