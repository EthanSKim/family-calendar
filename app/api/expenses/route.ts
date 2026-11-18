import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { db, dbFail } from '@/lib/db';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const bad = (s: number, m: string) => NextResponse.json({ error: m }, { status: s });

export async function GET(req: Request) {
  if (!isAuthed()) return bad(401, 'unauthorized');
  const p = new URL(req.url).searchParams, from = p.get('from') ?? '', to = p.get('to') ?? '';
  if (!DATE.test(from) || !DATE.test(to)) return bad(400, 'bad range');
  const { data, error } = await db().from('expenses').select('*').gte('date', from).lte('date', to).order('date').order('created_at');
  return error ? dbFail(error) : NextResponse.json(data);
}

export async function POST(req: Request) {
  if (!isAuthed()) return bad(401, 'unauthorized');
  const b = await req.json().catch(() => ({}));
  const name = typeof b.name === 'string' ? b.name.trim().slice(0, 100) : '';
  const cents = b.amount_cents;
  if (!DATE.test(b.date ?? '') || !name || !Number.isInteger(cents) || cents < 1 || cents > 100000000) return bad(400, 'invalid');
  const { data, error } = await db().from('expenses').insert({ date: b.date, name, amount_cents: cents }).select().single();
  return error ? dbFail(error) : NextResponse.json(data, { status: 201 });
}
