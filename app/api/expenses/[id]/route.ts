import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { db, dbFail } from '@/lib/db';

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { error } = await db().from('expenses').delete().eq('id', params.id);
  return error ? dbFail(error) : NextResponse.json({ ok: true });
}
