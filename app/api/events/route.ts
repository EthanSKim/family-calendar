import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { db, dbFail } from '@/lib/db';
import { DATE, fields } from '@/lib/events';

const no = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 });

export async function GET(req: Request) {
  if (!isAuthed()) return no();
  const p = new URL(req.url).searchParams, from = p.get('from') ?? '', to = p.get('to') ?? '';
  if (!DATE.test(from) || !DATE.test(to)) return NextResponse.json({ error: 'bad range' }, { status: 400 });
  const { data, error } = await db().from('events').select('*').gte('date', from).lte('date', to).order('date').order('start_time', { nullsFirst: true });
  return error ? dbFail(error) : NextResponse.json(data);
}

export async function POST(req: Request) {
  if (!isAuthed()) return no();
  const b = fields(await req.json().catch(() => ({})));
  if (!b.title || !DATE.test(b.date)) return NextResponse.json({ error: 'title and date required' }, { status: 400 });
  const { data, error } = await db().from('events').insert(b).select().single();
  return error ? dbFail(error) : NextResponse.json(data, { status: 201 });
}
