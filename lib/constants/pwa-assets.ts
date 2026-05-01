/**
 * PWA assets under `public/icons_and_manifest/` (URL prefix `/icons_and_manifest`).
 *
 * Canonical launcher PNGs are synced from `android/` (and `icons/` sizes from Android + iOS).
 * Apple home-screen: `ios/180.png`. Windows tile meta: `windows/Square150x150Logo.scale-100.png`.
 * Legacy URLs `/icon.svg`, `/icon-192.png`, `/icon-512.png` redirect via `next.config.ts`.
 */
export const PWA_ASSETS = {
  base: "/icons_and_manifest",
  iconSvg: "/icons_and_manifest/icon.svg",
  icon192: "/icons_and_manifest/icon-192.png",
  icon512: "/icons_and_manifest/icon-512.png",
  /** iOS “Add to Home Screen” / Safari */
  appleTouch180: "/icons_and_manifest/ios/180.png",
  /** Windows pinned tile / Jump List (Edge) */
  windowsTile150: "/icons_and_manifest/windows/Square150x150Logo.scale-100.png",
  /** Extra sizes for `<link rel="icon">` + web manifest */
  icon48: "/icons_and_manifest/icons/icon-48x48.png",
  icon72: "/icons_and_manifest/icons/icon-72x72.png",
  icon96: "/icons_and_manifest/icons/icon-96x96.png",
  icon144: "/icons_and_manifest/icons/icon-144x144.png",
} as const;
