import { HmsAuthShell } from "@/components/auth/hms-auth-shell";
import { AppAttributionFooter } from "@/components/site/app-attribution-footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Qalbee — created for the sake of Allah, with the intention of benefit and ongoing charity.",
};

export default function AboutPage() {
  return (
    <HmsAuthShell>
      <div className="hms-auth-page-align-start w-full max-w-lg pb-6">
        <article
          className="space-y-5 text-left text-[15px] leading-relaxed"
          style={{ color: "var(--hms-text)" }}
        >
          <h1 className="hms-card-title text-center">About Qalbee</h1>
          <p>
            This app was created sincerely for the sake of Allah by Afkhan Fardeen Khan, son of Mohammad
            Haneef Khan.
          </p>
          <p>
            It is made with the intention that it benefits others and becomes a source of ṣadaqah jāriyah.
          </p>
          <p>If this app helps you, please remember us in your duʿāʾ.</p>
          <p className="font-medium" style={{ color: "var(--hms-text)" }}>
            May Allah accept this effort.
          </p>
        </article>
        <p className="mt-8 text-center text-sm">
          <a href="/" className="hms-form-link font-medium">
            Home
          </a>
        </p>
        <div className="mt-6">
          <AppAttributionFooter variant="plain" className="border-0 pt-0" hideAboutLink />
        </div>
      </div>
    </HmsAuthShell>
  );
}
