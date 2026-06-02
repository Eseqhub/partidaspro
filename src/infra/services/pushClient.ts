// Cliente de Web Push: registra o service worker, pede permissão e inscreve o dispositivo.

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const ENDPOINT_KEY = 'pp_push_endpoint';

export const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const getPushPermission = (): NotificationPermission | 'unsupported' =>
  pushSupported() ? Notification.permission : 'unsupported';

/** Endpoint do dispositivo atual (para excluir o próprio remetente ao enviar). */
export const getSavedEndpoint = (): string | null => {
  try { return localStorage.getItem(ENDPOINT_KEY); } catch { return null; }
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  const reg = existing ?? await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready.then(() => reg);
}

/** Pede permissão, inscreve no push e salva no backend. Retorna true se ativou. */
export async function enablePush(groupId: string | null): Promise<{ ok: boolean; reason?: string }> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };
  if (!VAPID_PUBLIC) return { ok: false, reason: 'vapid-missing' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  const reg = await ensureServiceWorker();

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
    });
  }

  const json = sub.toJSON();
  try { localStorage.setItem(ENDPOINT_KEY, sub.endpoint); } catch { /* ignore */ }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: { endpoint: sub.endpoint, keys: json.keys },
      groupId,
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) return { ok: false, reason: 'save-failed' };

  return { ok: true };
}

/** Dispara um push para o grupo (exclui o próprio dispositivo). */
export async function sendPush(args: { groupId: string; title: string; body: string; url?: string }) {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...args, excludeEndpoint: getSavedEndpoint() }),
      keepalive: true,
    });
  } catch { /* silencioso — push é best-effort */ }
}
