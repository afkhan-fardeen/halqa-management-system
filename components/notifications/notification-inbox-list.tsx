"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { resolveNotificationPath } from "@/lib/utils/notification-default-url";
import { partitionNotificationsByToday } from "@/lib/utils/notification-groups";
import { NotificationTypeIcon } from "@/components/notifications/notification-type-icon";
import { MarkReadButton } from "@/components/notifications/mark-read-button";

type Row = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string | null;
};

type FilterKey = "all" | "reminder" | "aiyanat" | "system";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reminder", label: "Reminders" },
  { key: "aiyanat", label: "Aiyanat" },
  { key: "system", label: "System" },
];

function typeMatchesFilter(type: string, filter: FilterKey): boolean {
  if (filter === "all") return true;
  const t = type.toLowerCase();
  if (filter === "reminder") return t === NOTIFICATION_TYPES.DAILY_REMINDER;
  if (filter === "aiyanat") {
    return (
      t === NOTIFICATION_TYPES.REGISTRATION_APPROVED ||
      t === NOTIFICATION_TYPES.REGISTRATION_REJECTED
    );
  }
  return (
    t !== NOTIFICATION_TYPES.DAILY_REMINDER &&
    t !== NOTIFICATION_TYPES.REGISTRATION_APPROVED &&
    t !== NOTIFICATION_TYPES.REGISTRATION_REJECTED
  );
}

function formatWhen(d: Date, compact: boolean) {
  if (compact) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatTypeLabel(type: string) {
  return type.replaceAll("_", " ");
}

function ctaLabelForType(type: string): string {
  if (type === NOTIFICATION_TYPES.DAILY_REMINDER) return "Open daily log";
  if (type === NOTIFICATION_TYPES.PENDING_REGISTRATION_STAFF) {
    return "Review registrations";
  }
  return "Open";
}

function Section({
  title,
  rows,
  compactTime,
  readLabel,
}: {
  title: string;
  rows: Row[];
  compactTime: boolean;
  readLabel: string;
}) {
  if (rows.length === 0) return null;
  return (
    <section className="hms-notif-group">
      <h2 className="hms-group-label">{title}</h2>
      {rows.map((n) => {
        const created =
          n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt);
        const targetHref = resolveNotificationPath(
          n.type,
          n.actionUrl ?? null,
        );
        const showCta = targetHref !== "/notifications";

        return (
          <div
            key={n.id}
            className="hms-notif-item"
            data-read={n.read ? "true" : "false"}
          >
            <NotificationTypeIcon type={n.type} />
            <div className="hms-notif-body">
              <p
                className="hms-notif-preview"
                style={{
                  fontWeight: n.read ? 500 : 600,
                  color: n.read ? "var(--hms-text3)" : "var(--hms-text)",
                }}
              >
                {n.message}
              </p>
              <p className="hms-notif-meta">
                {formatTypeLabel(n.type)} · {formatWhen(created, compactTime)}
              </p>
              {showCta ? (
                <Link href={targetHref} className="hms-notif-cta">
                  {ctaLabelForType(n.type)}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : null}
            </div>
            {!n.read ? (
              <MarkReadButton notificationId={n.id} label={readLabel} />
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

export function NotificationInboxList({
  rows,
  readLabel = "Read",
}: {
  rows: Row[];
  readLabel?: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => rows.filter((r) => typeMatchesFilter(r.type, filter)),
    [rows, filter],
  );

  const { today, earlier } = useMemo(
    () => partitionNotificationsByToday(filtered),
    [filtered],
  );

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <div
          className="flex size-14 items-center justify-center rounded-full"
          style={{ background: "var(--hms-bg2)" }}
        >
          <svg
            className="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--hms-text3)"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <p
          className="text-base font-medium"
          style={{ color: "var(--hms-text2)" }}
        >
          You&apos;re all caught up
        </p>
        <p
          className="max-w-sm text-sm leading-relaxed"
          style={{ color: "var(--hms-text3)" }}
        >
          Nothing in your inbox. Reminders and registration updates from your
          halqa team will appear here.
        </p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <>
        <div className="hms-filter-bar">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className="hms-filter-pill"
              data-active={filter === key ? "true" : "false"}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--hms-text2)" }}
          >
            No notifications in this category
          </p>
          <p className="text-sm" style={{ color: "var(--hms-text3)" }}>
            Try another filter or check back later.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hms-filter-bar">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className="hms-filter-pill"
            data-active={filter === key ? "true" : "false"}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <Section title="Today" rows={today} compactTime readLabel={readLabel} />
      <Section
        title="Earlier"
        rows={earlier}
        compactTime={false}
        readLabel={readLabel}
      />
    </>
  );
}
