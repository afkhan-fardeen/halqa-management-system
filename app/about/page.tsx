import { AboutPageClient } from "@/components/marketing/about-page-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Qalbee — created for the sake of Allah, with the intention of benefit and ongoing charity (ṣadaqah jāriyah).",
};

export default function AboutPage() {
  return <AboutPageClient />;
}
