// GET /api/keepalive — daily Vercel Cron ping so the free Supabase project never pauses for inactivity
// (a paused project breaks sync between devices). Uses the same VITE_SUPABASE_* env vars as the app.

export async function GET(request: Request): Promise<Response> {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return Response.json({ ok: false, error: 'Supabase env vars missing' }, { status: 500 })

  const res = await fetch(`${url}/rest/v1/user_data?select=username&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  return Response.json({ ok: res.ok, status: res.status }, { status: res.ok ? 200 : 502 })
}
