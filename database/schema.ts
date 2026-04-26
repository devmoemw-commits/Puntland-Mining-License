// import { relations } from "drizzle-orm";

import { relations, sql } from "drizzle-orm";
import {
  varchar,
  uuid,
  text,
  decimal,
  integer,
  pgTable,
  timestamp,
  boolean,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

// 👉 License Status Enum
export const licenseStatusEnum = pgEnum("license_status", [
  "PENDING",
  "REVIEW",
  "APPROVED",
  "REJECTED",
]);

/** Application roles (managed in DB; referenced by `users.role` and `role_permissions.role`). */
export const roles = pgTable("roles", {
  code: varchar("code", { length: 64 }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 👉 Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: varchar("role", { length: 64 })
    .notNull()
    .default("OFFICER")
    .references(() => roles.code, {
      onUpdate: "cascade",
      onDelete: "restrict",
    }),
  /** Personal signature image (ImageKit URL) for certificates when this user signs a license. */
  signatureImageUrl: text("signature_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Application permission codes (aligned with `lib/permissions.ts` `Permissions` values). */
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  code: varchar("code", { length: 128 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Maps role codes to permission rows (editable in DB). */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: varchar("role", { length: 64 })
      .notNull()
      .references(() => roles.code, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.role, table.permissionId] }),
  }),
);

/** Direct permission grants for a user (union with permissions implied by their role). */
export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.permissionId] }),
  }),
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Key/value org settings (certificate signature URL, minister stamp URL, etc.). */
export const systemConfig = pgTable("system_config", {
  configKey: varchar("config_key", { length: 128 }).primaryKey().notNull(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const approvalWorkflows = pgTable("approval_workflows", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  module: varchar("module", { length: 64 }).notNull().default("LICENSE"),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  definition: text("definition").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const licenseWorkflowInstances = pgTable("license_workflow_instances", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  licenseId: uuid("license_id")
    .notNull()
    .unique()
    .references(() => licenses.id, { onDelete: "cascade" }),
  workflowId: uuid("workflow_id")
    .notNull()
    .references(() => approvalWorkflows.id, { onDelete: "restrict" }),
  currentStepNumber: integer("current_step_number").default(0).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const licenseWorkflowTransitions = pgTable("license_workflow_transitions", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  instanceId: uuid("instance_id")
    .notNull()
    .references(() => licenseWorkflowInstances.id, { onDelete: "cascade" }),
  licenseId: uuid("license_id")
    .notNull()
    .references(() => licenses.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  fromStatus: licenseStatusEnum("from_status").notNull(),
  toStatus: licenseStatusEnum("to_status").notNull(),
  actedByUserId: uuid("acted_by_user_id").references(() => users.id, { onDelete: "set null" }),
  /** Snapshot of signer signature URL at action time to preserve immutable workflow history. */
  actedBySignatureUrl: text("acted_by_signature_url"),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 👉 Regions Table
export const regions = pgTable("regions", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 👉 Districts Table
export const districts = pgTable("districts", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  region_id: uuid("region_id")
    .notNull()
    .references(() => regions.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 👉 Licenses Table
export const licenses = pgTable("licenses", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  license_ref_id: varchar("license_ref_id", { length: 255 }).notNull().unique(),

  // 👉 STEP 1 - Company Info
  company_name: varchar("company_name", { length: 255 }).notNull(),
  business_type: varchar("business_type", { length: 255 }).notNull(),
  company_address: text("company_address"),
  region: varchar("region", { length: 255 }),
  district_id: uuid("district_id")
    .notNull()
    .references(() => districts.id),
  country_of_origin: varchar("country_of_origin", { length: 255 }),

  // 👉 License Status
  status: licenseStatusEnum("status").default("PENDING").notNull(),
  review_comment: text("review_comment"),

  // 👉 Link to district (not region)

  // 👉 STEP 2 - Personal Info
  full_name: varchar("full_name", { length: 255 }),
  mobile_number: varchar("mobile_number", { length: 255 }),
  email_address: text("email_address"),
  id_card_number: varchar("id_card_number", { length: 255 }),

  // 👉 STEP 3 - Document Info
  passport_photos: text("passport_photos"),
  company_profile: text("company_profile"),
  receipt_of_payment: text("receipt_of_payment"),
  environmental_assessment_plan: text("environmental_assessment_plan"),
  experience_profile: text("experience_profile"),
  risk_management_plan: text("risk_management_plan"),
  bank_statement: text("bank_statement"),

  // 👉 STEP 4 - License Info
  license_type: varchar("license_type", { length: 255 }),
  license_category: varchar("license_category", { length: 255 }),
  calculated_fee: decimal("calculated_fee", { precision: 10, scale: 2 }),
  license_area: text("license_area").array(),

  // 👉 STEP 5 - Signature true/false
  signature: boolean("signature").default(false),
  /** User who applied the official signature (links to users.signature_image_url). */
  signed_by_user_id: uuid("signed_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  // 👉 Dates
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),

  expire_date: timestamp("expire_date", { withTimezone: true })
    .notNull()
    .default(sql`NOW() + interval '1 year'`),
});

// 👉 Sample Analysis Table
export const sampleAnalysis = pgTable("sample_analysis", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),

  ref_id: varchar("license_ref_id", { length: 255 }).notNull(),
  
  name: varchar("name", { length: 255 }).notNull(),
  nationality: varchar("nationality", { length: 255 }).notNull(),
  passport_no: varchar("passport_no", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 255 }).notNull(),
  mineral_type: varchar("mineral_type", { length: 255 }).notNull(),

  signature: boolean("signature").default(false),

  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 👉 Relations for Drizzle ORM (optional, for easier querying)
export const districtRelations = relations(districts, ({ one, many }) => ({
  region: one(regions, {
    fields: [districts.region_id],
    references: [regions.id],
  }),
  licenses: many(licenses),
}));

export const licenseRelations = relations(licenses, ({ one }) => ({
  district: one(districts, {
    fields: [licenses.district_id],
    references: [districts.id],
  }),
}));
