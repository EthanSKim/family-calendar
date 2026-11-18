import { NextResponse } from 'next/server';
import { isAuthed, sessionCookie } from '@/lib/auth';
import { db, dbFail } from '@/lib/db';

export const dynamic = 'force-dynamic';
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const p = new URL(req.url).searchParams;
  const [from, to, xfrom, xto] = ['from', 'to', 'xfrom', 'xto'].map((k) => p.get(k) ?? '');
  if (![from, to, xfrom, xto].every((d) => DATE.test(d))) return NextResponse.json({ error: 'bad range' }, { status: 400 });

  const c = db();
  const results = await Promise.all([
    c.from('events').select('*').gte('date', from).lte('date', to).order('date').order('start_time', { nullsFirst: true }),
    c.from('expenses').select('*').gte('date', xfrom).lte('date', xto).order('date').order('created_at'),
    c.from('grocery_items').select('*').order('created_at'),
    c.from('todos').select('*').order('created_at'),
    c.from('anniversaries').select('*').order('month').order('day'),
  ]);
  const failed = results.find((r) => r.error);
  if (failed) return dbFail(failed.error!);
  const [events, expenses, groceries, todos, anniversaries] = results.map((r) => r.data);
  const res = NextResponse.json({ events, expenses, groceries, todos, anniversaries }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(...sessionCookie());
  return res;
}
