"use client";

import type { ReactNode } from "react";

export function AuthPage({
  eyebrow,
  title,
  description,
  children,
  footer,
  wide,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Wider card for multi-column register */
  wide?: boolean;
}) {
  return (
    <div className="hms-auth-page w-full">
      <div className={`hms-card ${wide ? "hms-card-wide" : ""}`}>
        {eyebrow ? <p className="hms-card-eyebrow">{eyebrow}</p> : null}
        <h1 className="hms-card-title">{title}</h1>
        {description ? <p className="hms-card-sub">{description}</p> : null}
        <div className="min-w-0">{children}</div>
        {footer ? (
          <div className="mt-6 border-t pt-4 text-center" style={{ borderColor: "var(--hms-border)" }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
