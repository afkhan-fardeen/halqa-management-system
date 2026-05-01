"use client";

import Link from "next/link";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Lock,
  Phone,
  User,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PushNotificationsOptIn } from "@/components/pwa/push-notifications-opt-in";
import { StaffPageHeader } from "@/components/dashboard/staff-page-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { StaffRole } from "@/lib/auth/roles";
import {
  formatHalqaGenderLine,
  initials,
  staffRoleLabel,
} from "@/lib/utils/profile-display";
import { cn } from "@/lib/utils";

export type StaffProfileUserSnapshot = {
  name: string;
  email: string;
  role: StaffRole;
  halqaDisplay: string;
  genderUnit: string;
};

const profileLinkRow =
  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-staff-surface-container-low dark:hover:bg-slate-800/80";

export function StaffProfileContent({
  phone,
  user,
}: {
  phone: string;
  user: StaffProfileUserSnapshot;
}) {
  const { name, email, role, halqaDisplay, genderUnit } = user;
  const halqaGenderLine = formatHalqaGenderLine(halqaDisplay, genderUnit);

  return (
    <div className="space-y-8 md:space-y-10">
      <StaffPageHeader
        title="Profile & settings"
        description="Your account, unit scope, and notifications."
      />

      <div className="staff-elevated-surface flex flex-col items-center rounded-2xl bg-staff-surface-container-lowest px-6 py-8 text-center dark:bg-slate-900">
        <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-staff-primary font-staff-headline text-2xl font-bold text-white dark:bg-teal-500 dark:text-teal-950">
          {initials(name)}
        </div>
        <h2 className="font-staff-headline mt-4 text-xl font-bold text-staff-on-surface dark:text-slate-100">
          {name || "Staff"}
        </h2>
        <p className="mt-1 text-sm text-staff-on-surface-variant">{email}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            {staffRoleLabel(role)}
          </span>
          <span className="rounded-full bg-staff-surface-container px-3 py-1 text-[11px] font-semibold text-staff-on-surface-variant dark:bg-slate-800 dark:text-slate-300">
            {halqaGenderLine}
          </span>
        </div>
      </div>

      <Card className="staff-elevated-surface border-staff-outline-variant/20 bg-staff-surface-container-lowest dark:border-slate-700/80 dark:bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="font-staff-headline text-base text-staff-on-surface dark:text-slate-100">
            Notifications
          </CardTitle>
          <CardDescription className="text-staff-on-surface-variant">
            Web push for alerts on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationsOptIn />
        </CardContent>
      </Card>

      <Card className="staff-elevated-surface border-staff-outline-variant/20 bg-staff-surface-container-lowest dark:border-slate-700/80 dark:bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="font-staff-headline text-base text-staff-on-surface dark:text-slate-100">
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 px-0">
          <Link href="/dashboard/attendance/programs" className={profileLinkRow}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-staff-primary-container text-staff-on-primary-container dark:bg-teal-950/50 dark:text-teal-200">
              <CalendarDays className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-staff-on-surface dark:text-slate-100">
                Session attendance
              </span>
              <span className="block text-xs text-staff-on-surface-variant">
                Programs, sessions, and member marks
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-staff-on-surface-variant" aria-hidden />
          </Link>
          <Separator className="bg-staff-outline-variant/20" />
          <div className={cn(profileLinkRow, "pointer-events-none opacity-80")}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-staff-surface-container text-staff-on-surface-variant dark:bg-slate-800">
              <User className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant">
                Name
              </span>
              <span className="block text-sm font-medium text-staff-on-surface dark:text-slate-100">
                {name}
              </span>
            </span>
          </div>
          <Separator className="bg-staff-outline-variant/20" />
          <div className={cn(profileLinkRow, "pointer-events-none")}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-staff-surface-container text-staff-on-surface-variant dark:bg-slate-800">
              <Phone className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant">
                Phone
              </span>
              <span className="block text-sm font-medium text-staff-on-surface dark:text-slate-100">
                {phone || "—"}
              </span>
            </span>
          </div>
          <Separator className="bg-staff-outline-variant/20" />
          <div className={cn(profileLinkRow, "pointer-events-none")}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-staff-surface-container text-staff-on-surface-variant dark:bg-slate-800">
              <Building2 className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-xs font-bold uppercase tracking-wider text-staff-on-surface-variant">
                Halqa and gender
              </span>
              <span className="block text-sm font-medium text-staff-on-surface dark:text-slate-100">
                {halqaGenderLine}
              </span>
              <span className="mt-0.5 block text-[11px] text-staff-on-surface-variant">
                Fixed for your role
              </span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="staff-elevated-surface border-staff-outline-variant/20 bg-staff-surface-container-lowest dark:border-slate-700/80 dark:bg-slate-900">
        <CardHeader className="pb-2">
          <CardTitle className="font-staff-headline text-base text-staff-on-surface dark:text-slate-100">
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Link href="/forgot-password" className={profileLinkRow}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-staff-surface-container text-staff-on-surface-variant dark:bg-slate-800">
              <Lock className="size-[18px]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-staff-on-surface dark:text-slate-100">
                Reset password
              </span>
              <span className="block text-xs text-staff-on-surface-variant">
                We’ll email you a link to choose a new password
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-staff-on-surface-variant" aria-hidden />
          </Link>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-staff-on-surface-variant">
        Password resets are sent only to the email address on this account.
      </p>

      <div className="max-w-md">
        <SignOutButton variant="outline" className="w-full border-staff-outline-variant/30 font-semibold" />
      </div>
    </div>
  );
}
