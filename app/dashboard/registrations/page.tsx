import { auth } from "@/auth";
import { PendingRegistrationsTable } from "@/components/dashboard/pending-registrations";
import {
  StaffPageHeader,
  StaffPanel,
} from "@/components/dashboard/staff-page-section";
import { getPendingRegistrations } from "@/lib/queries/pending-registrations";

export default async function DashboardRegistrationsPage() {
  const session = await auth();
  const raw = await getPendingRegistrations();
  const rows = raw.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <StaffPageHeader
        title="Pending registrations"
        description={
          <>
            Review people who signed up to join your halqa.{" "}
            {session?.user?.role !== "ADMIN"
              ? "You only see requests that match your halqa and gender."
              : "You see all pending requests across halqas."}
          </>
        }
      />

      <StaffPanel
        title="Queue"
        description={`${rows.length} waiting for review`}
      >
        <PendingRegistrationsTable rows={rows} />
      </StaffPanel>
    </div>
  );
}
