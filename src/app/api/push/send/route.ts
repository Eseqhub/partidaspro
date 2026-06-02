import webpush from 'web-push';
import { supabase } from '@/infra/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@partidaspro.app';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// Dispara push para todos os dispositivos inscritos de um grupo.
export async function POST(request: Request) {
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return Response.json({ error: 'VAPID não configurado no servidor' }, { status: 500 });
    }
    const { groupId, title, body, url, excludeEndpoint } = await request.json();
    if (!groupId || !title) {
      return Response.json({ error: 'groupId e title são obrigatórios' }, { status: 400 });
    }

    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('group_id', groupId);
    if (error) throw error;

    const payload = JSON.stringify({
      title,
      body: body ?? '',
      url: url ?? '/dashboard',
      tag: 'match-update',
    });

    const stale: string[] = [];
    await Promise.all((subs ?? []).map(async (s: any) => {
      if (excludeEndpoint && s.endpoint === excludeEndpoint) return; // não notifica quem disparou
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
      } catch (err: any) {
        // 404/410 = inscrição expirada → remove
        if (err?.statusCode === 404 || err?.statusCode === 410) stale.push(s.endpoint);
      }
    }));

    if (stale.length) {
      await supabase.from('push_subscriptions').delete().in('endpoint', stale);
    }

    return Response.json({ ok: true, total: subs?.length ?? 0, removed: stale.length });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'erro' }, { status: 500 });
  }
}
