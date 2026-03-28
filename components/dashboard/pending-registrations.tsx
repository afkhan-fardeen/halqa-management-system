"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  approveRegistration,
  rejectRegistration,
  type ReviewActionState,
} from "@/lib/actions/registration-review";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type PendingRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  halqa: string;
  genderUnit: string;
  language: string;
  /** ISO string — serialized from the server */
  createdAt: string;
};

function formatHalqa(h: string) {
  return h.replaceAll("_", " ");
}

const initialReview: ReviewActionState | null = null;

function ApproveCell({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(
    approveRegistration,
    initialReview,
  );

  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <input type="hidden" name="userId" value={userId} />
      {state?.error ? (
        <span className="text-destructive max-w-[10rem] text-xs">{state.error}</span>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "…" : "Approve"}
      </Button>
    </form>
  );
}

function RejectCell({ userId }: { userId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    rejectRegistration,
    initialReview,
  );

  useEffect(() => {
    if (state?.success) {
      dialogRef.current?.close();
    }
  }, [state?.success]);

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => dialogRef.current?.showModal()}
      >
        Reject
      </Button>
      <dialog
        ref={dialogRef}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-4 shadow-lg backdrop:bg-black/50",
        )}
      >
        <form action={action} className="grid gap-3">
          <input type="hidden" name="userId" value={userId} />
          <p className="font-medium">Reject registration</p>
          <p className="text-muted-foreground text-sm">
            The applicant will receive this message by email when outgoing mail
            is configured on the server.
          </p>
          <div className="grid gap-2">
            <Label htmlFor={`reason-${userId}`}>Reason</Label>
            <Textarea
              id={`reason-${userId}`}
              name="reason"
              required
              minLength={1}
              maxLength={2000}
              rows={4}
              placeholder="Brief reason shown to the applicant"
            />
          </div>
          {state?.error ? (
            <p className="text-destructive text-sm">{state.error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "…" : "Confirm reject"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export function PendingRegistrationsTable({ rows }: { rows: PendingRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No pending registrations in your scope.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Halqa</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Lang</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.phone}</TableCell>
              <TableCell>{formatHalqa(row.halqa)}</TableCell>
              <TableCell>{row.genderUnit}</TableCell>
              <TableCell>{row.language}</TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ApproveCell userId={row.id} />
                  <RejectCell userId={row.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
