"use client";

import { useCallback, useEffect, useState } from "react";
import { FormControlLabel, Switch } from "@mui/material";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function cardClassName() {
  return "border-border bg-card text-card-foreground rounded-lg border p-4 shadow-sm";
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/** True for Apple Safari (not Chrome/Firefox/Edge on iOS or desktop). */
function isAppleSafari(): boolean {
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

/**
 * Lets signed-in users subscribe the current device to Web Push (requires VAPID on server).
 * Always renders a visible card (never returns null) so the profile section is never empty.
 */
export function PushNotificationsOptIn() {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insecureOrigin, setInsecureOrigin] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.hostname;
    const localhost = host === "localhost" || host === "127.0.0.1";
    setInsecureOrigin(!window.isSecureContext && !localhost);
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);

    void (async () => {
      if (!ok) {
        setConfigured(false);
        setReady(true);
        return;
      }
      try {
        const res = await fetch("/api/push/vapid-public-key");
        setConfigured(res.ok);
        if (res.ok) {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            setSubscribed(!!sub);
          } catch {
            setSubscribed(false);
          }
        }
      } catch {
        setConfigured(false);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const enable = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/push/vapid-public-key");
      if (!res.ok) {
        setError("Push is not available on this server.");
        return;
      }
      const { publicKey } = (await res.json()) as { publicKey: string };
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setError("Notification permission was not granted.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setError("Could not create subscription.");
        return;
      }
      const save = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!save.ok) {
        setError("Could not save subscription.");
        return;
      }
      setSubscribed(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError("Could not unsubscribe.");
    } finally {
      setBusy(false);
    }
  }, []);

  const onToggle = useCallback(
    async (_: unknown, checked: boolean) => {
      if (checked) await enable();
      else await disable();
    },
    [enable, disable],
  );

  if (!ready) {
    return (
      <div className={cardClassName()}>
        <p className="text-sm font-medium">Device notifications</p>
        <p className="text-muted-foreground mt-2 text-xs">Loading…</p>
      </div>
    );
  }

  if (!supported) {
    if (insecureOrigin) {
      return (
        <div className={cardClassName()}>
          <p className="text-sm font-medium">Device notifications</p>
          <div className="text-muted-foreground mt-2 space-y-2 text-xs leading-relaxed">
            <p>
              <strong>Web Push needs a secure context.</strong> On <code className="text-[11px]">http://192.168…</code>{" "}
              (or any non-localhost HTTP), browsers—including <strong>Chrome</strong>—do not enable the Push API, so
              this is not a “wrong browser” issue.
            </p>
            <p>
              Use <strong>http://localhost:3000</strong> on the machine running the app, or deploy with{" "}
              <strong>HTTPS</strong> and open that URL. Then refresh this page.
            </p>
          </div>
        </div>
      );
    }

    const ios = isIOS();
    const safari = isAppleSafari();

    if (ios) {
      return (
        <div className={cardClassName()}>
          <p className="text-sm font-medium">Device notifications</p>
          <div className="text-muted-foreground mt-2 space-y-2 text-xs leading-relaxed">
            <p>
              On <strong>iPhone / iPad</strong>, every browser uses the same engine; Web Push works only from an{" "}
              <strong>installed web app</strong> (iOS 16.4+), not always from a normal tab.
            </p>
            <p>
              In <strong>Safari</strong>: <strong>Share → Add to Home Screen</strong>, then open the app from that
              icon, sign in, and enable notifications here. (In Chrome on iOS, use the Share menu the same way.)
            </p>
          </div>
        </div>
      );
    }

    if (safari) {
      return (
        <div className={cardClassName()}>
          <p className="text-sm font-medium">Device notifications</p>
          <div className="text-muted-foreground mt-2 space-y-2 text-xs leading-relaxed">
            <p>
              Apple only enables <strong>Web Push</strong> in specific setups—often not in a normal Safari tab.
            </p>
            <p>
              <strong>Mac:</strong> Add this site as a <strong>web app to the Dock</strong> (Safari → File → Add to
              Dock), open that app, then try again—or use <strong>Chrome</strong> or <strong>Firefox</strong> in a
              regular tab on a <strong>secure</strong> URL (HTTPS or localhost).
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={cardClassName()}>
        <p className="text-sm font-medium">Device notifications</p>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          This environment does not expose Web Push (needs Service Worker, Push API, and Notifications in a secure
          context). If you are on an unusual network or embedded browser, try a normal desktop browser with{" "}
          <strong>HTTPS</strong> or <strong>http://localhost</strong>.
        </p>
      </div>
    );
  }

  if (configured === false) {
    return (
      <div className={cardClassName()}>
        <p className="text-sm font-medium">Device notifications</p>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          Push is not configured on this server. Add <code className="text-xs">VAPID_PUBLIC_KEY</code> and{" "}
          <code className="text-xs">VAPID_PRIVATE_KEY</code> to the server environment and restart the app.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClassName()}>
      <p className="text-sm font-medium">Device notifications</p>
      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
        Get alerts on this device when you receive in-app messages (install the app for best results).
      </p>
      {insecureOrigin ? (
        <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Web Push needs a <strong>secure context</strong>: use <strong>http://localhost:3000</strong> or{" "}
          <strong>HTTPS</strong> in production. Opening the site as <strong>http://192.168.x.x</strong> (LAN IP)
          over HTTP often blocks push — announcements may not arrive.
        </p>
      ) : null}
      {error ? <p className="text-destructive mt-2 text-xs">{error}</p> : null}
      <div className="mt-3">
        <FormControlLabel
          control={
            <Switch
              checked={subscribed}
              onChange={onToggle}
              disabled={busy}
              color="primary"
              inputProps={{ "aria-label": "Enable device notifications" }}
            />
          }
          label={
            <span className="text-sm font-medium text-foreground">
              {subscribed ? "Notifications on for this device" : "Off — tap to enable"}
            </span>
          }
        />
      </div>
    </div>
  );
}
