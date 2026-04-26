import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import {
  canAccessRoute,
  canAccessRouteByPermissions,
} from "@/lib/permissions"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
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
