import { MemberTopBarClient } from "@/components/member/member-top-bar-client";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";
import {
  formatHijriDateLine,
  HIJRI_DATE_FALLBACK,
} from "@/lib/utils/hijri-date";

export async function MemberTopBar() {
  const unread = await getUnreadNotificationCount();
  const now = new Date();
  const gregorianLine = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const hijriLine = formatHijriDateLine(now) || HIJRI_DATE_FALLBACK;
  const dateAriaLabel = `${gregorianLine}. ${hijriLine}`;
  const dateIso = now.toISOString().slice(0, 10);

  return (
    <MemberTopBarClient
      unread={unread}
      gregorianLine={gregorianLine}
      hijriLine={hijriLine}
      dateAriaLabel={dateAriaLabel}
      dateIso={dateIso}
    />
  );
}
