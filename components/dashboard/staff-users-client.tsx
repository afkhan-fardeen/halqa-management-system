"use client";

import { useActionState, useState } from "react";
import {
  createStaffUser,
  editStaffUser,
  type StaffUserActionState,
  type StaffUserRow,
} from "@/lib/actions/staff-user-management";
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
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
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

export function StaffUsersClient({ staffUsers }: { staffUsers: StaffUserRow[] }) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  function handleNew() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(row: StaffUserRow) {
    setForm(fromRow(row));
    setEditingId(row.id);
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function set(key: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const action = isEditing ? editAction : createAction;

  return (
    <div className="space-y-6">
      <StaffPanel
        title="Staff accounts"
        description={`${staffUsers.length} staff user${staffUsers.length !== 1 ? "s" : ""}`}
        headerClassName="flex flex-row items-center justify-between mb-4"
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
            <table className="w-full text-sm">
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
                    <td className="py-3 pr-4 text-staff-on-surface-variant dark:text-slate-300">
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
                      <button
                        type="button"
                        onClick={() => handleEdit(row)}
                        className="text-xs font-medium text-staff-primary underline-offset-2 hover:underline dark:text-slate-300"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </StaffPanel>

      {showForm ? (
        <StaffPanel
          title={isEditing ? "Edit staff user" : "Create staff user"}
          description={
            isEditing
              ? "Update this staff member's details and scope."
              : "Fill in details for the new staff account."
          }
        >
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
                <FieldRow label="Email" htmlFor="email">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="user@qalbee.com"
                  />
                </FieldRow>
              ) : (
                <FieldRow label="Email">
                  <div className="flex h-8 items-center rounded-lg border border-input bg-input/10 px-2.5 text-sm text-staff-on-surface-variant dark:text-slate-400">
                    {form.email}
                  </div>
                </FieldRow>
              )}

              <FieldRow label="Name" htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Full name"
                />
              </FieldRow>

              <FieldRow label="Phone" htmlFor="phone">
                <Input
                  id="phone"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+97300000000"
                />
              </FieldRow>

              <FieldRow
                label={isEditing ? "New password (leave blank to keep)" : "Password"}
                htmlFor="password"
              >
                <Input
                  id="password"
                  name={isEditing ? "newPassword" : "password"}
                  type="password"
                  required={!isEditing}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={isEditing ? "Leave blank to keep current" : "Min 8 characters"}
                />
              </FieldRow>

              <FieldRow label="Display tag / title (optional)" htmlFor="staffTag">
                <Input
                  id="staffTag"
                  name="staffTag"
                  value={form.staffTag}
                  onChange={(e) => set("staffTag", e.target.value)}
                  placeholder="e.g. Ladies Incharge, Joint Secretary"
                />
              </FieldRow>

              <FieldRow label="Role" htmlFor="role">
                <SelectNative
                  id="role"
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

              <FieldRow label="Own halqa (home unit)" htmlFor="halqa">
                <SelectNative
                  id="halqa"
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

              <FieldRow label="Own gender unit" htmlFor="genderUnit">
                <SelectNative
                  id="genderUnit"
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
                <div className="flex items-center gap-3">
                  <input
                    id="scopeAllHalqas"
                    name="scopeAllHalqas"
                    type="checkbox"
                    value="true"
                    checked={form.scopeAllHalqas}
                    onChange={(e) => set("scopeAllHalqas", e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-staff-primary"
                  />
                  <input
                    type="hidden"
                    name="scopeAllHalqas"
                    value={form.scopeAllHalqas ? "true" : "false"}
                  />
                  <Label htmlFor="scopeAllHalqas">
                    Can see all halqas
                    <span className="ml-1 text-xs font-normal text-staff-on-surface-variant dark:text-slate-400">
                      (unchecked = own halqa only)
                    </span>
                  </Label>
                </div>

                <FieldRow label="Gender visibility" htmlFor="scopeGender">
                  <SelectNative
                    id="scopeGender"
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
                Example: "Ladies admin" — tick All halqas + select Female only.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending
                  ? isEditing
                    ? "Saving…"
                    : "Creating…"
                  : isEditing
                    ? "Save changes"
                    : "Create staff user"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </StaffPanel>
      ) : null}
    </div>
  );
}
