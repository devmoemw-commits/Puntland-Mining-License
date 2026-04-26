import { users } from "@/database/schema";

/**
 * Explicit column maps so queries work when optional migrations (e.g. signature_image_url)
 * are not applied yet. Avoid `db.select().from(users)` which pulls the full Drizzle schema.
 */
export const usersAuthLogin = {
  id: users.id,
  name: users.name,
  email: users.email,
  password: users.password,
  role: users.role,
} as const;

export const usersIdEmail = {
  id: users.id,
  email: users.email,
} as const;

export const usersPasswordCheck = {
  password: users.password,
} as const;

export const usersPasswordResetLookup = {
  id: users.id,
  name: users.name,
  email: users.email,
} as const;
