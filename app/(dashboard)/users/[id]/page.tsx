import UserUpdateForm from "@/app/(auth)/_components/user-update"
import type { TUsers } from "@/types"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/database/drizzle"
import { users } from "@/database/schema"
import {
  Permissions,
  PERMISSION_DESCRIPTIONS,
  type Permission,
} from "@/lib/permissions"
import { userHasPermission } from "@/lib/permissions-server"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { listRoles } from "@/lib/data/get-roles"
import { getDirectPermissionCodesForUser } from "@/lib/data/role-permissions-map"

interface Props {
   params: Promise<{ id: string }>
}

const permissionCatalog = (
  Object.entries(PERMISSION_DESCRIPTIONS) as [Permission, string][]
)
  .map(([code, label]) => ({ code, label }))
  .sort((a, b) => a.code.localeCompare(b.code))

/** Load user in RSC — avoid `fetch` to own API (session cookies are not sent server-side). */
async function getUserById(id: string): Promise<TUsers | null> {
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      signatureImageUrl: users.signatureImageUrl,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)

  if (row.length === 0) return null

  const u = row[0]
  return {
    id: u.id,
    name: u.name ?? "",
    email: u.email,
    role: u.role,
    signatureImageUrl: u.signatureImageUrl ?? null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    emailVerified: u.emailVerified != null,
  }
}

const page = async ({ params }: Props) => {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  if (
    !(await userHasPermission(
      session.user.id,
      session.user.role,
      Permissions.USERS_MANAGE,
    ))
  ) {
    redirect("/?error=unauthorized")
  }

  const { id } = await params
  const [user, rolesList, directCodes] = await Promise.all([
    getUserById(id),
    listRoles(),
    getDirectPermissionCodesForUser(id),
  ])

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-6">{`The user with ID ${id} could not be found.`}</p>
          <Link
            href="/users"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Back to Users
          </Link>
        </div>
      </div>
    )
  }

  return (
    <UserUpdateForm
      user={user}
      roles={rolesList}
      permissionCatalog={permissionCatalog}
      initialDirectPermissionCodes={directCodes}
    />
  )
}

export default page
