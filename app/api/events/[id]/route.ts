import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { db, dbFail } from '@/lib/db';
import { DATE, fields } from '@/lib/events';

const no = () => NextResponse.json({ error: 'unauthorized' }, { status: 401 });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return no();
  const b = fields(await req.json().catch(() => ({})));
  if (!b.title || !DATE.test(b.date)) return NextResponse.json({ error: 'title and date required' }, { status: 400 });
  const { data, error } = await db().from('events').update(b).eq('id', params.id).select().single();
  return error ? dbFail(error) : NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return no();
  const { error } = await db().from('events').delete().eq('id', params.id);
  return error ? dbFail(error) : NextResponse.json({ ok: true });
}
