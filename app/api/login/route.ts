import { createHash, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { COOKIE, makeToken } from '@/lib/auth';
import { db } from '@/lib/db';

const h = (s: string) => createHash('sha256').update(s).digest();
const WINDOW_MIN = 15, MAX_FAILS = 8;

export async function POST(req: Request) {
  if (!process.env.FAMILY_PASSCODE || !process.env.SESSION_SECRET)
    return NextResponse.json({ error: 'server not configured' }, { status: 500 });

  const ip = (req.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  try {
    const since = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();
    const { count } = await db().from('login_attempts').select('*', { count: 'exact', head: true }).eq('ip', ip).gte('at', since);
    if ((count ?? 0) >= MAX_FAILS) return NextResponse.json({ error: 'too many attempts' }, { status: 429 });
  } catch { /* limiter unavailable: still check the passcode */ }

  const { passcode } = await req.json().catch(() => ({}));
  const ok = typeof passcode === 'string' && timingSafeEqual(h(passcode), h(process.env.FAMILY_PASSCODE));
  if (!ok) {
    try {
      await db().from('login_attempts').insert({ ip });
      await db().from('login_attempts').delete().lt('at', new Date(Date.now() - 86400000).toISOString());
    } catch { /* ignore */ }
    return NextResponse.json({ error: 'bad passcode' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return res;
}
