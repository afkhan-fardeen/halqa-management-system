/** Root loading UI — avoids a blank screen while RSC streams. */
export default function Loading() {
  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-2 text-sm text-stone-500">
      <div
        className="size-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
        aria-hidden
      />
      <span>Loading…</span>
    </div>
  );
}
