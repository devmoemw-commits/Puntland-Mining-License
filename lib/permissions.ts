/**
 * Central roles & permissions for the mining license system.
 * Roles are stored on `users.role` (see database/schema.ts).
 * Permissions are app-level capabilities used by middleware, APIs, and server actions.
 */

export const USER_ROLES = [
  "SUPER_ADMIN",
  "MINISTER",
  "GENERAL_DIRECTOR",
  "DIRECTOR",
  "OFFICER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string | undefined | null): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value);
}

export const Permissions = {
  USERS_MANAGE: "users.manage",
  REPORTS_VIEW: "reports.view",
  SAMPLE_ANALYSIS_ACCESS: "sample_analysis.access",
  /** Sign-off on sample records (matches current product behavior: GD-level). */
  SAMPLE_SIGNATURE: "sample.signature",
  LICENSE_REGISTER: "license.register",
  /** Move licenses into review with issue comments. */
  LICENSE_REVIEW: "license.review",
  /** Approve license status. */
  LICENSE_APPROVE: "license.approve",
  /** Reject license status. */
  LICENSE_REJECT: "license.reject",
  /** Legacy umbrella permission used by existing moderation actions. */
  LICENSE_MODERATE: "license.moderate",
  /** Organization assets: authority signature, minister stamp, etc. */
  SYSTEM_SETTINGS: "system.settings",
  APPROVAL_WORKFLOW_VIEW: "approval_workflow.view",
  APPROVAL_WORKFLOW_CREATE: "approval_workflow.create",
  APPROVAL_WORKFLOW_EDIT: "approval_workflow.edit",
  APPROVAL_WORKFLOW_DELETE: "approval_workflow.delete",
  /** Read-only / viewer surfaces (dashboards, lists) — pair with fine-grained perms as needed. */
  VIEWER_ACCESS: "viewer.access",
  /** Operational actions (submit, process work) — pair with module perms (e.g. license.register). */
  ACTIONS_USE: "actions.use",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

/** Human-readable labels for DB seeding and admin UIs. */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [Permissions.USERS_MANAGE]: "Manage users (create, update, delete)",
  [Permissions.REPORTS_VIEW]: "View reports",
  [Permissions.SAMPLE_ANALYSIS_ACCESS]: "View and manage sample analysis records",
  [Permissions.SAMPLE_SIGNATURE]: "Sign or revoke sample analysis signatures",
  [Permissions.LICENSE_REGISTER]: "Create and update mining license applications",
  [Permissions.LICENSE_REVIEW]:
    "Move licenses to review and provide issue comments",
  [Permissions.LICENSE_APPROVE]: "Approve licenses",
  [Permissions.LICENSE_REJECT]: "Reject licenses",
  [Permissions.LICENSE_MODERATE]:
    "Approve or revoke licenses, sign certificates, delete licenses",
  [Permissions.SYSTEM_SETTINGS]:
    "Manage system configuration (signatures, stamps, branding assets)",
  [Permissions.APPROVAL_WORKFLOW_VIEW]: "View approval workflow definitions",
  [Permissions.APPROVAL_WORKFLOW_CREATE]: "Create approval workflows",
  [Permissions.APPROVAL_WORKFLOW_EDIT]: "Edit approval workflows",
  [Permissions.APPROVAL_WORKFLOW_DELETE]: "Delete approval workflows",
  [Permissions.VIEWER_ACCESS]: "Viewer access (read dashboards and shared read-only views)",
  [Permissions.ACTIONS_USE]: "Use operational actions (submit and process work in assigned modules)",
};

const ALL_PERMISSIONS: Permission[] = Object.values(Permissions);

/** Display names for the Postgres `role` enum (users module UI). */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  MINISTER: "Minister",
  GENERAL_DIRECTOR: "General Director",
  DIRECTOR: "Director",
  OFFICER: "Officer",
};

/**
 * Default capabilities per system role (Postgres `role` enum on `users`).
 * Seeded into `role_permissions`; user accounts and role assignment stay manual.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> =
  {
    SUPER_ADMIN: ALL_PERMISSIONS,
    MINISTER: [
      Permissions.VIEWER_ACCESS,
      Permissions.ACTIONS_USE,
      Permissions.REPORTS_VIEW,
      Permissions.LICENSE_REGISTER,
      Permissions.LICENSE_REVIEW,
      Permissions.LICENSE_APPROVE,
      Permissions.LICENSE_REJECT,
      Permissions.LICENSE_MODERATE,
      Permissions.SYSTEM_SETTINGS,
      Permissions.APPROVAL_WORKFLOW_VIEW,
      Permissions.APPROVAL_WORKFLOW_CREATE,
      Permissions.APPROVAL_WORKFLOW_EDIT,
      Permissions.APPROVAL_WORKFLOW_DELETE,
    ],
    GENERAL_DIRECTOR: [
      Permissions.VIEWER_ACCESS,
      Permissions.ACTIONS_USE,
      Permissions.REPORTS_VIEW,
      Permissions.SAMPLE_ANALYSIS_ACCESS,
      Permissions.SAMPLE_SIGNATURE,
      Permissions.LICENSE_REGISTER,
      Permissions.LICENSE_REVIEW,
      Permissions.LICENSE_APPROVE,
      Permissions.LICENSE_REJECT,
      Permissions.LICENSE_MODERATE,
      Permissions.SYSTEM_SETTINGS,
      Permissions.APPROVAL_WORKFLOW_VIEW,
      Permissions.APPROVAL_WORKFLOW_CREATE,
      Permissions.APPROVAL_WORKFLOW_EDIT,
      Permissions.APPROVAL_WORKFLOW_DELETE,
    ],
    DIRECTOR: [
      Permissions.VIEWER_ACCESS,
      Permissions.ACTIONS_USE,
      Permissions.REPORTS_VIEW,
      Permissions.SAMPLE_ANALYSIS_ACCESS,
      Permissions.LICENSE_REGISTER,
      Permissions.LICENSE_REVIEW,
      Permissions.LICENSE_APPROVE,
      Permissions.LICENSE_REJECT,
      Permissions.LICENSE_MODERATE,
      Permissions.APPROVAL_WORKFLOW_VIEW,
    ],
    OFFICER: [
      Permissions.VIEWER_ACCESS,
      Permissions.ACTIONS_USE,
      Permissions.LICENSE_REGISTER,
    ],
  };

/** Effective permission codes and labels for a role (for Users UI). */
export function getPermissionsForRoleDisplay(role: string | null | undefined) {
  if (!isUserRole(role)) return [];
  return DEFAULT_ROLE_PERMISSIONS[role].map((p) => ({
    code: p,
    label: PERMISSION_DESCRIPTIONS[p],
  }));
}

/**
 * Route prefixes that require specific roles (longest prefix wins).
 * Paths not listed here only require a signed-in user (enforced by layout / session).
 */
export const ROUTE_ROLE_RULES: Record<string, readonly UserRole[]> = {
  "/users": ["SUPER_ADMIN"],
  "/reports": ["SUPER_ADMIN", "MINISTER", "GENERAL_DIRECTOR", "DIRECTOR"],
  "/sample-analysis": ["SUPER_ADMIN", "GENERAL_DIRECTOR", "DIRECTOR"],
  "/settings": ["SUPER_ADMIN", "MINISTER", "GENERAL_DIRECTOR"],
};

function matchingRouteRule(pathname: string): readonly UserRole[] | null {
  const entries = Object.entries(ROUTE_ROLE_RULES)
    .filter(
      ([prefix]) =>
        pathname === prefix ||
        pathname.startsWith(`${prefix}/`),
    )
    .sort((a, b) => b[0].length - a[0].length);

  return entries.length > 0 ? entries[0][1] : null;
}

/** Whether an authenticated user with `role` may open this pathname (UI + middleware). */
export function canAccessRoute(
  pathname: string,
  role: string | undefined | null,
): boolean {
  const allowedRoles = matchingRouteRule(pathname);
  if (!allowedRoles) return true;
  if (!isUserRole(role)) return false;
  return (allowedRoles as readonly string[]).includes(role);
}

/**
 * Route prefixes that require specific permissions (longest prefix wins).
 * Used by middleware and sidebar when `permissionCodes` are available on the session/JWT.
 */
export const ROUTE_PERMISSION_RULES: Record<string, readonly Permission[]> = {
  "/admin": [Permissions.USERS_MANAGE],
  "/users": [Permissions.USERS_MANAGE],
  "/reports": [Permissions.REPORTS_VIEW],
  "/sample-analysis": [Permissions.SAMPLE_ANALYSIS_ACCESS],
  "/settings": [Permissions.SYSTEM_SETTINGS],
  "/settings/approval-workflows": [Permissions.APPROVAL_WORKFLOW_VIEW],
  "/licenses": [Permissions.LICENSE_REGISTER],
};

function matchingPermissionRule(
  pathname: string,
): readonly Permission[] | null {
  const entries = Object.entries(ROUTE_PERMISSION_RULES)
    .filter(
      ([prefix]) =>
        pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
    .sort((a, b) => b[0].length - a[0].length);

  return entries.length > 0 ? entries[0][1] : null;
}

/** True if `permissionCodes` includes at least one of `required` (OR). Empty `required` → allow. */
export function sessionHasAnyPermission(
  permissionCodes: readonly string[] | undefined | null,
  required: readonly Permission[] | undefined | null,
): boolean {
  if (!required?.length) return true;
  if (!permissionCodes?.length) return false;
  const set = new Set(permissionCodes);
  return required.some((p) => set.has(p));
}

/** Whether effective permission codes allow this pathname (UI + middleware). */
export function canAccessRouteByPermissions(
  pathname: string,
  permissionCodes: readonly string[],
): boolean {
  const required = matchingPermissionRule(pathname);
  if (!required?.length) return true;
  return sessionHasAnyPermission(permissionCodes, required);
}

/**
 * Checks **compiled defaults** only (does not read `role_permissions` in the database).
 * For real authorization in server components, API routes, and actions, use
 * `userHasPermission` from `@/lib/permissions-server` (role + optional direct user grants).
 */
export function hasPermission(
  role: string | undefined | null,
  permission: Permission,
): boolean {
  if (!isUserRole(role)) return false;
  return DEFAULT_ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: string | undefined | null,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
