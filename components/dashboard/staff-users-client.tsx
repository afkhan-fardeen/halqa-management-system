"use client";

import { useActionState, useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  createStaffUser,
  deleteStaffUser,
  editStaffUser,
  type StaffUserActionState,
  type StaffUserRow,
} from "@/lib/actions/staff-user-management";
import { toast } from "sonner";
import { StaffPanel } from "@/components/dashboard/staff-page-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HALQA_VALUES, HALQA_LABELS } from "@/lib/constants/halqas";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "INCHARGE", label: "Incharge" },
  { value: "SECRETARY", label: "Secretary" },
] as const;

const GENDER_UNITS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

const SCOPE_GENDERS = [
  { value: "BOTH", label: "Both (male + female)" },
  { value: "MALE", label: "Male only" },
  { value: "FEMALE", label: "Female only" },
] as const;

function ScopeTag({
  scopeAllHalqas,
  scopeGender,
}: {
  scopeAllHalqas: boolean;
  scopeGender: string | null;
}) {
  const halqaLabel = scopeAllHalqas ? "All halqas" : "Own halqa";
  const genderLabel =
    scopeGender === "BOTH"
      ? "All genders"
      : scopeGender === "MALE"
        ? "Male only"
        : scopeGender === "FEMALE"
          ? "Female only"
          : "Own gender";
  return (
    <span className="text-xs text-staff-on-surface-variant dark:text-slate-400">
      {halqaLabel} · {genderLabel}
    </span>
  );
}

function FieldRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function SelectNative({
  id,
  name,
  value,
  onChange,
  children,
  required,
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="h-9 min-h-[2.25rem] w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
    >
      {children}
    </select>
  );
}

type FormState = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
  halqa: string;
  genderUnit: string;
  staffTag: string;
  scopeAllHalqas: boolean;
  scopeGender: string;
};

function emptyForm(): FormState {
  return {
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "ADMIN",
    halqa: "MANAMA",
    genderUnit: "MALE",
    staffTag: "",
    scopeAllHalqas: false,
    scopeGender: "null",
  };
}

function fromRow(row: StaffUserRow): FormState {
  return {
    email: row.email,
    password: "",
    name: row.name,
    phone: row.phone,
    role: row.role,
    halqa: row.halqa,
    genderUnit: row.genderUnit,
    staffTag: row.staffTag ?? "",
    scopeAllHalqas: row.scopeAllHalqas,
    scopeGender: row.scopeGender ?? "null",
  };
}

export function StaffUsersClient({
  staffUsers,
  currentUserId,
}: {
  staffUsers: StaffUserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const modalTitleId = useId();
  const modalDescId = useId();
  const [deletePending, startDelete] = useTransition();

  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [createState, createAction, createPending] = useActionState<
    StaffUserActionState | null,
    FormData
  >(createStaffUser, null);

  const [editState, editAction, editPending] = useActionState<
    StaffUserActionState | null,
    FormData
  >(editStaffUser, null);

  const isEditing = editingId !== null;
  const state = isEditing ? editState : createState;
  const pending = isEditing ? editPending : createPending;

  useEffect(() => {
    if (!showModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModal]);

  function handleNew() {
    setForm(emptyForm());
    setEditingId(null);
    setShowModal(true);
  }

  function handleEdit(row: StaffUserRow) {
    setForm(fromRow(row));
    setEditingId(row.id);
    setShowModal(true);
  }

  function handleCancel() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function set(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function confirmDeleteStaff(row: StaffUserRow) {
    if (
      !window.confirm(
        `Permanently delete staff account "${row.name}" (${row.email})? This cannot be undone.`,
      )
    ) {
      return;
    }
    startDelete(async () => {
      const res = await deleteStaffUser(row.id);
      if (res.ok) {
        toast.success("Staff user deleted");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const action = isEditing ? editAction : createAction;

  const modalTitle = isEditing ? "Edit staff user" : "Create staff user";
  const modalDescription = isEditing
    ? "Update this staff member’s details and visibility scope."
    : "Add a new admin, incharge, or secretary account.";

  return (
    <div className="space-y-6">
      <StaffPanel
        title="Staff accounts"
        description={`${staffUsers.length} staff user${staffUsers.length !== 1 ? "s" : ""}`}
      >
        <div className="mb-4 flex justify-end">
          <Button type="button" size="sm" onClick={handleNew}>
            + New staff user
          </Button>
        </div>

        {staffUsers.length === 0 ? (
          <p className="text-sm text-staff-on-surface-variant dark:text-slate-400">
            No staff users found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm md:min-w-0">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                  <th className="pb-2 pr-4 font-medium text-staff-on-surface-variant dark:text-slate-400">
                    Name / Tag
                  </th>
                  <th className="pb-2 pr-4 font-medium text-staff-on-surface-variant dark:text-slate-400">
                    Email
                  </th>
                  <th className="pb-2 pr-4 font-medium text-staff-on-surface-variant dark:text-slate-400">
                    Role
                  </th>
                  <th className="pb-2 pr-4 font-medium text-staff-on-surface-variant dark:text-slate-400">
                    Halqa / Gender
                  </th>
                  <th className="pb-2 pr-4 font-medium text-staff-on-surface-variant dark:text-slate-400">
                    Visibility scope
                  </th>
                  <th className="pb-2 font-medium text-staff-on-surface-variant dark:text-slate-400">
                    Status
                  </th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {staffUsers.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-medium text-staff-on-surface dark:text-slate-100">
                        {row.name}
                      </div>
                      {row.staffTag ? (
                        <div className="text-xs text-staff-on-surface-variant dark:text-slate-400">
                          {row.staffTag}
                        </div>
                      ) : null}
                    </td>
                    <td className="max-w-[180px] truncate py-3 pr-4 text-staff-on-surface-variant dark:text-slate-300">
                      {row.email}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          row.role === "ADMIN"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        )}
                      >
                        {row.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-staff-on-surface-variant dark:text-slate-300">
                      {row.halqa.replaceAll("_", " ")} ·{" "}
                      {row.genderUnit === "MALE" ? "Male" : "Female"}
                    </td>
                    <td className="py-3 pr-4">
                      <ScopeTag
                        scopeAllHalqas={row.scopeAllHalqas}
                        scopeGender={row.scopeGender}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          row.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="text-xs font-medium text-staff-primary underline-offset-2 hover:underline dark:text-slate-300"
                        >
                          Edit
                        </button>
                        {row.id === currentUserId ? (
                          <span
                            className="text-xs text-staff-on-surface-variant dark:text-slate-500"
                            title="You cannot delete your own account"
                          >
                            —
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={deletePending}
                            onClick={() => confirmDeleteStaff(row)}
                            className="text-xs font-medium text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </StaffPanel>

      {showModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          aria-hidden={false}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity dark:bg-black/65"
            onClick={handleCancel}
          />

          {/* Panel: bottom sheet on narrow screens, centered card on sm+ */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            aria-describedby={modalDescId}
            className={cn(
              "relative z-[101] flex max-h-[min(92dvh,840px)] w-full flex-col",
              "rounded-t-2xl border border-slate-200 bg-staff-surface-container-lowest shadow-2xl dark:border-slate-700 dark:bg-slate-900",
              "sm:max-h-[min(88dvh,780px)] sm:max-w-2xl sm:rounded-2xl",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200 sm:slide-in-from-bottom-0",
            )}
            style={{
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 pb-3 pt-4 dark:border-slate-800 sm:px-6 sm:pb-4 sm:pt-5">
              <div className="min-w-0 pr-2">
                <h2
                  id={modalTitleId}
                  className="font-staff-headline text-lg font-bold tracking-tight text-staff-on-surface dark:text-slate-100 sm:text-xl"
                >
                  {modalTitle}
                </h2>
                <p
                  id={modalDescId}
                  className="mt-1 text-sm leading-relaxed text-staff-on-surface-variant dark:text-slate-400"
                >
                  {modalDescription}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="size-9 shrink-0 rounded-full p-0"
                onClick={handleCancel}
                aria-label="Close"
              >
                <X className="size-[18px]" aria-hidden />
              </Button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
              <form action={action} className="space-y-5">
                {isEditing ? (
                  <input type="hidden" name="userId" value={editingId ?? ""} />
                ) : null}

                {state && !state.ok ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {state.error}
                  </div>
                ) : null}

                {state?.ok ? (
                  <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300">
                    {isEditing ? "Staff user updated." : "Staff user created successfully."}
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  {!isEditing ? (
                    <FieldRow label="Email" htmlFor="staff-email">
                      <Input
                        id="staff-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="off"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="user@qalbee.com"
                        className="h-9 min-h-[2.25rem]"
                      />
                    </FieldRow>
                  ) : (
                    <FieldRow label="Email">
                      <div className="flex min-h-9 items-center rounded-lg border border-input bg-input/10 px-2.5 text-sm text-staff-on-surface-variant dark:text-slate-400">
                        {form.email}
                      </div>
                    </FieldRow>
                  )}

                  <FieldRow label="Name" htmlFor="staff-name">
                    <Input
                      id="staff-name"
                      name="name"
                      required
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Full name"
                      className="h-9 min-h-[2.25rem]"
                    />
                  </FieldRow>

                  <FieldRow label="Phone" htmlFor="staff-phone">
                    <Input
                      id="staff-phone"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+97300000000"
                      className="h-9 min-h-[2.25rem]"
                    />
                  </FieldRow>

                  <FieldRow
                    label={isEditing ? "New password (leave blank to keep)" : "Password"}
                    htmlFor="staff-password"
                  >
                    <Input
                      id="staff-password"
                      name={isEditing ? "newPassword" : "password"}
                      type="password"
                      required={!isEditing}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder={
                        isEditing ? "Leave blank to keep current" : "Min 8 characters"
                      }
                      className="h-9 min-h-[2.25rem]"
                    />
                  </FieldRow>

                  <FieldRow label="Display tag / title (optional)" htmlFor="staff-tag">
                    <Input
                      id="staff-tag"
                      name="staffTag"
                      value={form.staffTag}
                      onChange={(e) => set("staffTag", e.target.value)}
                      placeholder="e.g. Ladies Incharge, Joint Secretary"
                      className="h-9 min-h-[2.25rem]"
                    />
                  </FieldRow>

                  <FieldRow label="Role" htmlFor="staff-role">
                    <SelectNative
                      id="staff-role"
                      name="role"
                      value={form.role}
                      onChange={(v) => set("role", v)}
                      required
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </SelectNative>
                  </FieldRow>

                  <FieldRow label="Own halqa (home unit)" htmlFor="staff-halqa">
                    <SelectNative
                      id="staff-halqa"
                      name="halqa"
                      value={form.halqa}
                      onChange={(v) => set("halqa", v)}
                      required
                    >
                      {HALQA_VALUES.map((h) => (
                        <option key={h} value={h}>
                          {HALQA_LABELS[h]}
                        </option>
                      ))}
                    </SelectNative>
                  </FieldRow>

                  <FieldRow label="Own gender unit" htmlFor="staff-gender-unit">
                    <SelectNative
                      id="staff-gender-unit"
                      name="genderUnit"
                      value={form.genderUnit}
                      onChange={(v) => set("genderUnit", v)}
                      required
                    >
                      {GENDER_UNITS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </SelectNative>
                  </FieldRow>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="mb-3 text-sm font-semibold text-staff-on-surface dark:text-slate-100">
                    Visibility scope
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        id="staff-scope-all-halqas"
                        name="scopeAllHalqas"
                        type="checkbox"
                        value="true"
                        checked={form.scopeAllHalqas}
                        onChange={(e) => set("scopeAllHalqas", e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-staff-primary"
                      />
                      <input
                        type="hidden"
                        name="scopeAllHalqas"
                        value={form.scopeAllHalqas ? "true" : "false"}
                      />
                      <Label htmlFor="staff-scope-all-halqas" className="font-normal">
                        Can see all halqas
                        <span className="mt-0.5 block text-xs font-normal text-staff-on-surface-variant dark:text-slate-400">
                          Unchecked means own halqa only.
                        </span>
                      </Label>
                    </div>

                    <FieldRow label="Gender visibility" htmlFor="staff-scope-gender">
                      <SelectNative
                        id="staff-scope-gender"
                        name="scopeGender"
                        value={form.scopeGender}
                        onChange={(v) => set("scopeGender", v)}
                      >
                        <option value="null">Own gender unit only (default)</option>
                        {SCOPE_GENDERS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </SelectNative>
                    </FieldRow>
                  </div>

                  <p className="mt-3 text-xs text-staff-on-surface-variant dark:text-slate-400">
                    Example: “Ladies admin” — enable all halqas + Female only.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                    {pending
                      ? isEditing
                        ? "Saving…"
                        : "Creating…"
                      : isEditing
                        ? "Save changes"
                        : "Create staff user"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
