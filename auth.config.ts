import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { isStaffRole } from "@/lib/auth/roles";

const publicPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/install",
]);

/** `/login` and `/login/` both match public routes. */
function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1) || "/";
  }
  return pathname;
}

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ request, auth }) {
      const pathname = request.nextUrl.pathname;
      const p = normalizePathname(pathname);

      if (
        pathname.startsWith("/_next") ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/sw.js"
      ) {
        return true;
      }

      if (pathname.startsWith("/api/auth")) return true;
      if (pathname.startsWith("/api/cron")) return true;

      // Staff should land on the dashboard, not the member home.
      if (auth?.user && isStaffRole(auth.user.role) && p === "/") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (publicPaths.has(p)) {
        if (
          auth?.user &&
          (p === "/login" || p === "/register")
        ) {
          const url = request.nextUrl.clone();
          url.pathname = isStaffRole(auth.user.role) ? "/dashboard" : "/home";
          return NextResponse.redirect(url);
        }
        return true;
      }

      // Member home: entry point without forcing /login first (avoids blank redirect issues).
      if (p === "/") {
        return true;
      }

      if (!auth?.user) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }

      const { role } = auth.user;

      if (role === "MEMBER" && pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      if (isStaffRole(role) && !pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.halqa = user.halqa;
        token.genderUnit = user.genderUnit;
        token.language = user.language;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.halqa = token.halqa as typeof session.user.halqa;
        session.user.genderUnit = token.genderUnit as typeof session.user.genderUnit;
        session.user.language = token.language as typeof session.user.language;
        session.user.status = token.status as typeof session.user.status;
      }
      return session;
    },
  },
};
