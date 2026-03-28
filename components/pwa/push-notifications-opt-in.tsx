"use client";

import { useCallback, useEffect, useState } from "react";
import { FormControlLabel, Switch } from "@mui/material";
import {
  getPushEnvironment,
  hasActivePushSubscription,
  isAppleSafari,
  isIOS,
  subscribeDeviceToPush,
  unsubscribeDeviceFromPush,
} from "@/components/pwa/push-subscription-utils";

function cardClassName() {
  return "border-border bg-card text-card-foreground rounded-lg border p-4 shadow-sm";
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

    void (async () => {
      const env = await getPushEnvironment();
      setInsecureOrigin(env.insecureOrigin);
      setSupported(env.supported);
      setConfigured(env.configured);

      if (!env.supported) {
        setReady(true);
        return;
      }
      if (env.configured) {
        try {
          setSubscribed(await hasActivePushSubscription());
        } catch {
          setSubscribed(false);
        }
      }
      setReady(true);
    })();
  }, []);

  const enable = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await subscribeDeviceToPush();
      if (result.ok) {
        setSubscribed(true);
      } else {
        setError(result.error);
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await unsubscribeDeviceFromPush();
      if (result.ok) {
        setSubscribed(false);
      } else {
        setError(result.error);
      }
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
