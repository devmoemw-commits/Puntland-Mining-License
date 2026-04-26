// GET single user by ID
import { db } from "@/database/drizzle"
import { users } from "@/database/schema"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { requireApiPermission } from "@/lib/permissions-server"
import { Permissions } from "@/lib/permissions"

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, { params }: Context) {
  const denied = await requireApiPermission(Permissions.USERS_MANAGE)
  if (denied) return denied

  const resolvedParams = await params
  const id = resolvedParams.id

  try {
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (userData.length === 0) {
      return NextResponse.json({ error: "License not found" }, { status: 404 })
    }


    return NextResponse.json( userData[0])
  } catch (error) {
    console.error("Error fetching single license:", error)
    return NextResponse.json({ error: `Error ${error}` }, { status: 500 })
  }
}
