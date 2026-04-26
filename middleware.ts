import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import {
  canAccessRoute,
  canAccessRouteByPermissions,
} from "@/lib/permissions"

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET

export async function middleware(request: NextRequest) {
  if (!authSecret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Missing AUTH_SECRET/NEXTAUTH_SECRET for authentication middleware")
    }
    // In local dev, avoid crashing hard when secret is not configured yet.
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: authSecret,
    secureCookie: request.nextUrl.protocol === "https:",
  })

  const { pathname } = request.nextUrl

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!token.role) {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  const userRole = token.role as string
  const permissionCodes = (token.permissionCodes as string[] | undefined) ?? []

  const allowed =
    permissionCodes.length > 0
      ? canAccessRouteByPermissions(pathname, permissionCodes)
      : canAccessRoute(pathname, userRole)

  if (!allowed) {
    return NextResponse.redirect(new URL("/?error=unauthorized", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only protect specific routes
    "/users/:path*",
    "/admin/:path*",
    "/reports/:path*",
    "/sample-analysis/:path*",
    "/settings",
    "/settings/:path*",
    "/licenses/:path*",

    //api routes
  ],
}
