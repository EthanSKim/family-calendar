import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Server-only: uses the service role key, never sent to the browser.
export const db = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

// Real error goes to the server log (Vercel > Logs); the browser only sees a generic message.
export function dbFail(e: { message: string }) {
  console.error('[db]', e.message);
  return NextResponse.json({ error: 'database error' }, { status: 500 });
}
