import type { DefaultSession } from "next-auth"

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string
    role?: string
    name?: string | null
    email?: string | null
    permissionCodes?: string[]
  }

  interface Session {
    user: {
      id: string
      role?: string
      name?: string | null
      email?: string | null
      permissionCodes?: string[]
    } & DefaultSession["user"]
  }
}

// Extend JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    name?: string | null
    email?: string | null
    permissionCodes?: string[]
  }
}
