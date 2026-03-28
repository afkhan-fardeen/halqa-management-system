/**
 * PWA static assets live under `public/icons_and_manifest/` (URL prefix `/icons_and_manifest`).
 * Place `icon-192.png` and `icon-512.png` next to `icon.svg`; optional extra sizes in `icons/`.
 */
export const PWA_ASSETS = {
  base: "/icons_and_manifest",
  iconSvg: "/icons_and_manifest/icon.svg",
  icon192: "/icons_and_manifest/icon-192.png",
  icon512: "/icons_and_manifest/icon-512.png",
} as const;
