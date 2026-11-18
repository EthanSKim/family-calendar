import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { db, dbFail } from '@/lib/db';
import { KINDS, pick } from '@/lib/items';

type Ctx = { params: { kind: string } };
const bad = (s: number, m: string) => NextResponse.json({ error: m }, { status: s });

export async function GET(_: Request, { params }: Ctx) {
  if (!isAuthed()) return bad(401, 'unauthorized');
  const k = KINDS[params.kind];
  if (!k) return bad(404, 'unknown list');
  let q = db().from(k.table).select('*');
  for (const o of k.order) q = q.order(o);
  const { data, error } = await q;
  return error ? dbFail(error) : NextResponse.json(data);
}

export async function POST(req: Request, { params }: Ctx) {
  if (!isAuthed()) return bad(401, 'unauthorized');
  if (!KINDS[params.kind]) return bad(404, 'unknown list');
  const body = pick(params.kind, await req.json().catch(() => ({})), false);
  if (!body) return bad(400, 'invalid');
  const { data, error } = await db().from(KINDS[params.kind].table).insert(body).select().single();
  return error ? dbFail(error) : NextResponse.json(data, { status: 201 });
}
