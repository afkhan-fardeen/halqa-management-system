/**
 * NextAuth session + route protection (see auth.config.ts callbacks.authorized).
 * Uses `middleware` export for broad hosting compatibility (e.g. Vercel + Next.js 16).
 * @see https://authjs.dev/getting-started/session-management/protecting
 */
export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
