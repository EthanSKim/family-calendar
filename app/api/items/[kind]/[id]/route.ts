import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { db, dbFail } from '@/lib/db';
import { KINDS, pick } from '@/lib/items';

type Ctx = { params: { kind: string; id: string } };
const bad = (s: number, m: string) => NextResponse.json({ error: m }, { status: s });

export async function PATCH(req: Request, { params }: Ctx) {
  if (!isAuthed()) return bad(401, 'unauthorized');
  if (!KINDS[params.kind]) return bad(404, 'unknown list');
  const body = pick(params.kind, await req.json().catch(() => ({})), true);
  if (!body) return bad(400, 'invalid');
  const { data, error } = await db().from(KINDS[params.kind].table).update(body).eq('id', params.id).select().single();
  return error ? dbFail(error) : NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: Ctx) {
  if (!isAuthed()) return bad(401, 'unauthorized');
  if (!KINDS[params.kind]) return bad(404, 'unknown list');
  const { error } = await db().from(KINDS[params.kind].table).delete().eq('id', params.id);
  return error ? dbFail(error) : NextResponse.json({ ok: true });
}
