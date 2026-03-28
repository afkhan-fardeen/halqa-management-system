import { auth } from "@/auth";
import { MarketingLandingClient } from "@/components/marketing/marketing-landing-client";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Qalbee — Halqa management",
  description:
    "Track ibadah, outreach, and contributions. Built for halqas in Bahrain.",
};

export default async function RootMarketingPage() {
  const session = await auth();
  const isActiveMember =
    session?.user?.role === "MEMBER" && session.user.status === "ACTIVE";
  if (session?.user && isActiveMember) {
    redirect("/home");
  }
  return <MarketingLandingClient />;
}
