import { auth } from "@/auth"
import { redirect } from "next/navigation"
import UserProfile from "@/components/user-profile"
import { db } from "@/database/drizzle"
import { users } from "@/database/schema"
import { eq } from "drizzle-orm"

const Page = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const row = await db
    .select({ signatureImageUrl: users.signatureImageUrl })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return (
    <div>
      <UserProfile
        session={session}
        signatureImageUrl={row[0]?.signatureImageUrl ?? null}
      />
    </div>
  )
}

export default Page
