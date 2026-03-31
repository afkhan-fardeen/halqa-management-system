import { cn } from "@/lib/utils";

/** Fixed box for Material Symbols in staff sidebar rows (alignment with one- or two-line labels). */
export function StaffNavIcon({
  name,
  active,
}: {
  name: string;
  active: boolean;
}) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center"
      aria-hidden
    >
      <span
        className={cn(
          "material-symbols-outlined text-[1.25rem] leading-none",
          active
            ? "text-blue-700 dark:text-blue-300"
            : "text-slate-500 dark:text-slate-400",
        )}
      >
        {name}
      </span>
    </span>
  );
}
