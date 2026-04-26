"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect } from "react"

export default function AutoLogout() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session) return

    const expirationTime = new Date(session.expires).getTime()
    const now = new Date().getTime()
    const timeout = expirationTime - now

    if (timeout > 0) {
      const timer = setTimeout(() => {
        signOut()
      }, timeout)

      return () => clearTimeout(timer)
    } else {
      signOut()
    }
  }, [session])

  return null
}
