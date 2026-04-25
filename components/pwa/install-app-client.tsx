"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppClient() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    queueMicrotask(() => setIos(isIos));

    const onBip = (e: Event) => {
      e.preventDefault();
      queueMicrotask(() => setDeferred(e as BeforeInstallPromptEvent));
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Install Qalbee
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Add Qalbee to your home screen for quick access. After you sign in, open{" "}
          <strong>Profile</strong> to turn on device notifications.
        </p>
      </div>

      <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Android / Chrome / Edge</h2>
        <ol className="text-muted-foreground mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>Open this site in Chrome or Edge.</li>
          <li>Tap the menu (⋮) and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
          <li>Or use the button below when your browser offers it.</li>
        </ol>
        {deferred ? (
          <Button type="button" className="mt-4" onClick={install}>
            Install app
          </Button>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm">
            If no install button appears, your browser may not support prompts on this page—use the menu steps
            above.
          </p>
        )}
      </div>

      <div className="bg-card border-border rounded-2xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold">iPhone / iPad (Safari)</h2>
        <ol className="text-muted-foreground mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>Open this site in <strong>Safari</strong>.</li>
          <li>Tap the <strong>Share</strong> icon.</li>
          <li>Scroll and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
        </ol>
        {ios ? (
          <p className="text-primary mt-4 text-sm font-medium">
            You appear to be on iOS—use Safari and Add to Home Screen for the full app experience.
          </p>
        ) : null}
      </div>

      <p className="text-center text-sm">
        <Link href="/login" className="text-primary font-semibold underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
