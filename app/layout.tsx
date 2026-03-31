import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display, Geist_Mono, Roboto } from "next/font/google";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { SwUpdatePrompt } from "@/components/pwa/sw-update-prompt";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { MuiAppProvider } from "@/components/providers/mui-app-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const hmsSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-hms-sans",
});

const hmsSerif = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hms-serif",
});

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/** Match `app/manifest.ts` theme_color for browser chrome + Android task switcher. */
const THEME_LIGHT = "#008080";
const THEME_DARK = "#004c4c";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: THEME_DARK },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Qalbee",
    template: "%s · Qalbee",
  },
  description:
    "Qalbee — daily worship, outreach, and contributions for your community.",
  applicationName: "Qalbee",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "Qalbee",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${hmsSans.variable} ${hmsSerif.variable} ${roboto.variable} ${fontMono.variable} h-full`}
    >
      <body
        className={`${roboto.className} bg-[#f5f5f5] text-gray-900 min-h-dvh flex flex-col antialiased [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)]`}
      >
        <MuiAppProvider>
          <RegisterServiceWorker />
          <SwUpdatePrompt />
          <AuthSessionProvider>
            {children}
            <Toaster />
          </AuthSessionProvider>
        </MuiAppProvider>
      </body>
    </html>
  );
}
