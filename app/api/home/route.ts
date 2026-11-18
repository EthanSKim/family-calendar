import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const lat = Number(process.env.HOME_LAT), lon = Number(process.env.HOME_LON);
  if (!process.env.HOME_LAT || !process.env.HOME_LON || !isFinite(lat) || !isFinite(lon)) return NextResponse.json({ error: 'not set' }, { status: 404 });
  return NextResponse.json({ lat, lon });
}
