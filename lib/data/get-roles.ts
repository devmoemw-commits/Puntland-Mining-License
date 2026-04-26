import { db } from "@/database/drizzle";
import { roles } from "@/database/schema";
import { asc } from "drizzle-orm";

export type RoleRow = {
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
};

export async function listRoles(): Promise<RoleRow[]> {
  const rows = await db.select().from(roles).orderBy(asc(roles.code));
  return rows.map((r) => ({
    code: r.code,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    createdAt: r.createdAt,
  }));
}
