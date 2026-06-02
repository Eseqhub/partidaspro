import { supabase } from '@/infra/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Salva (ou atualiza) a inscrição de push de um dispositivo.
export async function POST(request: Request) {
  try {
    const { subscription, groupId, userAgent } = await request.json();
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return Response.json({ error: 'inscrição inválida' }, { status: 400 });
    }

    const { error } = await supabase.from('push_subscriptions').upsert({
      group_id: groupId ?? null,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent ?? null,
    }, { onConflict: 'endpoint' });
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'erro' }, { status: 500 });
  }
}
