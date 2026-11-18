import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const COOKIE = 'fam_session';
const sig = () => createHmac('sha256', process.env.SESSION_SECRET ?? '').update('family').digest('hex');
export const makeToken = () => sig();

export function isAuthed() {
  const c = cookies().get(COOKIE)?.value;
  if (!c || !process.env.SESSION_SECRET) return false;
  const a = Buffer.from(c), b = Buffer.from(sig());
  return a.length === b.length && timingSafeEqual(a, b);
}

// Re-issued on every sync so a device that stays open never has to re-enter the passcode.
export const sessionCookie = () =>
  [COOKIE, makeToken(), { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' }] as const;
