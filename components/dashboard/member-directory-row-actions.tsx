"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { BarChart3, KeyRound, Trash2, UserX } from "lucide-react";
import { toast } from "sonner";
import { adminSendPasswordResetEmail } from "@/lib/actions/password-reset";
import {
  deactivateMember,
  deleteMemberPermanently,
} from "@/lib/actions/member-admin";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function MemberDirectoryRowActions({
  memberId,
  monthYyyyMm,
  isDeactivated,
}: {
  memberId: string;
  monthYyyyMm: string;
  isDeactivated: boolean;
}) {
  const router = useRouter();
  const [deletePending, startDelete] = useTransition();
  const monthlyHref = `/dashboard/reports/monthly?memberId=${encodeURIComponent(memberId)}&month=${encodeURIComponent(monthYyyyMm)}`;

  function confirmDeleteMember() {
    if (
      !window.confirm(
        "Permanently delete this member and all their logs and data? This cannot be undone.",
      )
    ) {
      return;
    }
    startDelete(async () => {
      const fd = new FormData();
      fd.set("userId", memberId);
      const res = await deleteMemberPermanently(fd);
      if (res.ok) {
        toast.success("Member deleted");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
      <Tooltip>
        <TooltipTrigger
          delay={250}
          render={
            <Link
              href={monthlyHref}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-staff-primary transition-colors hover:bg-staff-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-primary/40"
              aria-label="Monthly report"
            >
              <BarChart3 className="size-[18px]" aria-hidden />
            </Link>
          }
        />
        <TooltipContent side="top">Monthly report</TooltipContent>
      </Tooltip>

      <form action={adminSendPasswordResetEmail} className="inline">
        <input type="hidden" name="userId" value={memberId} />
        <Tooltip>
          <TooltipTrigger
            delay={250}
            render={
              <button
                type="submit"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-staff-on-surface-variant transition-colors hover:bg-staff-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-primary/40"
                aria-label="Send password reset email"
              >
                <KeyRound className="size-[18px]" aria-hidden />
              </button>
            }
          />
          <TooltipContent side="top">Send password reset email</TooltipContent>
        </Tooltip>
      </form>

      {!isDeactivated ? (
        <form action={deactivateMember} className="inline">
          <input type="hidden" name="userId" value={memberId} />
          <Tooltip>
            <TooltipTrigger
              delay={250}
              render={
                <button
                  type="submit"
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-staff-error transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-error/35 dark:hover:bg-red-950/30",
                  )}
                  aria-label="Deactivate member"
                >
                  <UserX className="size-[18px]" aria-hidden />
                </button>
              }
            />
            <TooltipContent side="top">Deactivate member</TooltipContent>
          </Tooltip>
        </form>
      ) : null}

      <Tooltip>
        <TooltipTrigger
          delay={250}
          render={
            <button
              type="button"
              disabled={deletePending}
              onClick={confirmDeleteMember}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/35 dark:text-red-400 dark:hover:bg-red-950/30",
              )}
              aria-label="Permanently delete member"
            >
              <Trash2 className="size-[18px]" aria-hidden />
            </button>
          }
        />
        <TooltipContent side="top">Permanently delete member</TooltipContent>
      </Tooltip>
    </div>
  );
}
