import {
  boolean,
  date,
  decimal,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { HALQA_VALUES } from "@/lib/constants/halqas";

export const userRoleEnum = pgEnum("user_role", [
  "MEMBER",
  "SECRETARY",
  "INCHARGE",
  "ADMIN",
]);

export const halqaEnum = pgEnum("halqa", [...HALQA_VALUES]);

export const genderUnitEnum = pgEnum("gender_unit", ["MALE", "FEMALE"]);

export const userStatusEnum = pgEnum("user_status", [
  "PENDING",
  "ACTIVE",
  "REJECTED",
  "DEACTIVATED",
]);

export const languageEnum = pgEnum("language", ["EN", "UR"]);

/** Male: BA_JAMAAT, MUNFARID, QAZA — Female: ON_TIME, QAZA (validated in app by gender) */
export const prayerStatusEnum = pgEnum("prayer_status", [
  "BA_JAMAAT",
  "MUNFARID",
  "QAZA",
  "ON_TIME",
]);

export const quranTypeEnum = pgEnum("quran_type", [
  "TILAWAT",
  "TAFSEER",
  "BOTH",
]);

export const contactStatusEnum = pgEnum("contact_status", [
  "MUSLIM",
  "NON_MUSLIM",
]);

export const aiyanatStatusEnum = pgEnum("aiyanat_status", [
  "PAID",
  "NOT_PAID",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    role: userRoleEnum("role").notNull(),
    halqa: halqaEnum("halqa").notNull(),
    genderUnit: genderUnitEnum("gender_unit").notNull(),
    status: userStatusEnum("status").notNull(),
    language: languageEnum("language").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    approvedBy: uuid("approved_by"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [
    index("users_halqa_gender_status_idx").on(
      table.halqa,
      table.genderUnit,
      table.status,
    ),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [table.id],
      name: "users_approved_by_users_id_fk",
    }),
  ],
);

export const dailyLogs = pgTable(
  "daily_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date", { mode: "date" }).notNull(),
    fajr: prayerStatusEnum("fajr").notNull(),
    dhuhr: prayerStatusEnum("dhuhr").notNull(),
    asr: prayerStatusEnum("asr").notNull(),
    maghrib: prayerStatusEnum("maghrib").notNull(),
    isha: prayerStatusEnum("isha").notNull(),
    quranType: quranTypeEnum("quran_type").notNull(),
    quranSurah: varchar("quran_surah", { length: 255 }).notNull(),
    quranPages: integer("quran_pages").notNull(),
    hadith: boolean("hadith").notNull(),
    literatureSkipped: boolean("literature_skipped").notNull().default(false),
    bookTitle: varchar("book_title", { length: 255 }),
    bookDescription: text("book_description"),
    salatSaved: boolean("salat_saved").notNull().default(false),
    quranSaved: boolean("quran_saved").notNull().default(false),
    hadithSaved: boolean("hadith_saved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("daily_logs_user_id_date_unique").on(table.userId, table.date),
    index("daily_logs_date_idx").on(table.date),
  ],
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "date" }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    status: contactStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("contacts_user_id_log_date_idx").on(table.userId, table.logDate)],
);

export const aiyanat = pgTable(
  "aiyanat",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: varchar("month", { length: 7 }).notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: aiyanatStatusEnum("status").notNull(),
    paymentDate: date("payment_date", { mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("aiyanat_user_id_month_unique").on(table.userId, table.month),
    index("aiyanat_user_id_month_idx").on(table.userId, table.month),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 100 }).notNull(),
    message: text("message").notNull(),
    /** In-app / push target path (e.g. /submit, /dashboard/registrations). */
    actionUrl: varchar("action_url", { length: 512 }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("notifications_user_id_read_idx").on(table.userId, table.read)],
);

/** Web Push subscription per device; endpoint is unique across users. */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    authKey: text("auth_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("push_subscriptions_user_id_idx").on(table.userId)],
);

/** One row per member per calendar day when a reminder email was sent (idempotency for cron). */
export const dailyReminderEmailSent = pgTable(
  "daily_reminder_email_sent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    logDate: date("log_date", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("daily_reminder_email_sent_user_id_log_date_unique").on(
      table.userId,
      table.logDate,
    ),
    index("daily_reminder_email_sent_log_date_idx").on(table.logDate),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("password_reset_tokens_token_hash_idx").on(table.tokenHash),
    index("password_reset_tokens_user_id_idx").on(table.userId),
  ],
);

export const dailyUnitStats = pgTable(
  "daily_unit_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date", { mode: "date" }).notNull(),
    halqa: halqaEnum("halqa").notNull(),
    genderUnit: genderUnitEnum("gender_unit").notNull(),
    totalMembers: integer("total_members").notNull(),
    submittedCount: integer("submitted_count").notNull(),
    quranPagesTotal: integer("quran_pages_total").notNull(),
    qazaCount: integer("qaza_count").notNull(),
    contactsCount: integer("contacts_count").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("daily_unit_stats_date_halqa_unit_unique").on(
      table.date,
      table.halqa,
      table.genderUnit,
    ),
  ],
);
