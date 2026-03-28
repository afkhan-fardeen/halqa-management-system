/** Shared Web Push helpers for profile opt-in and welcome modal. */

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** True for Apple Safari (not Chrome/Firefox/Edge on iOS or desktop). */
export function isAppleSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = isIOS();
  if (iOS) {
    if (/CriOS|FxiOS|EdgiOS|OPiOS|EdgA|OPT\//.test(ua)) return false;
    return /Safari\//.test(ua) || (/AppleWebKit/.test(ua) && !/CriOS|FxiOS/.test(ua));
  }
  if (/Chrome|Chromium|Edg\/|OPR\/|Firefox|Opera\//.test(ua)) return false;
  return /Safari/i.test(ua) && /Macintosh|Mac OS X/.test(ua);
}

export type PushEnv = {
  supported: boolean;
  configured: boolean;
  insecureOrigin: boolean;
};

export async function getPushEnvironment(): Promise<PushEnv> {
  const host = window.location.hostname;
  const localhost = host === "localhost" || host === "127.0.0.1";
  const insecureOrigin = !window.isSecureContext && !localhost;
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  let configured = false;
  if (supported) {
    try {
      const res = await fetch("/api/push/vapid-public-key", {
        credentials: "include",
      });
      configured = res.ok;
    } catch {
      configured = false;
    }
  }

  return { supported, configured, insecureOrigin };
}

/**
 * Ensures `/sw.js` is registered and a worker is active (dashboard + member app both need this).
 * Without this, `navigator.serviceWorker.ready` can hang or fail if the user enables push before
 * the root layout’s registration effect runs.
 */
export async function ensureServiceWorkerReady(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return await navigator.serviceWorker.ready;
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Could not register the offline worker (sw.js).";
    throw new Error(msg);
  }
}

export async function hasActivePushSubscription(): Promise<boolean> {
  try {
    const reg = await ensureServiceWorkerReady();
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

/**
 * Requests permission, subscribes, and POSTs to `/api/push/subscribe`.
 */
export async function subscribeDeviceToPush(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/push/vapid-public-key", { credentials: "include" });
    if (!res.ok) {
      return { ok: false, error: "Push is not available on this server." };
    }
    const { publicKey } = (await res.json()) as { publicKey: string };
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      return { ok: false, error: "Notification permission was not granted." };
    }
    const reg = await ensureServiceWorkerReady();
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
    const json = sub.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      return { ok: false, error: "Could not create subscription." };
    }
    const save = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(json),
    });
    if (!save.ok) {
      let detail = "Could not save subscription.";
      if (save.status === 401) {
        detail = "Your session expired. Sign in again, then enable notifications.";
      } else {
        try {
          const errBody = (await save.json()) as { error?: string };
          if (errBody.error) {
            detail =
              save.status === 400 && errBody.error === "Invalid subscription"
                ? "Browser sent an invalid subscription. Refresh the page and try again."
                : errBody.error;
          }
        } catch {
          /* keep default */
        }
      }
      return { ok: false, error: detail };
    }
    return { ok: true };
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Something went wrong. Try again.";
    return { ok: false, error: msg };
  }
}

export const PUSH_WELCOME_DISMISS_KEY = "qalbee-push-welcome-dismissed";

export async function unsubscribeDeviceFromPush(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const reg = await ensureServiceWorkerReady();
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not unsubscribe." };
  }
}
