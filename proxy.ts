import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/onboarding", "/debts", "/finances", "/investments", "/settings"]

// Routes that should redirect to dashboard if authenticated
const authRoutes = ["/login", "/register"]

export function proxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  const pathname = request.nextUrl.pathname

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect to dashboard if accessing auth routes with token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest).*)"],
}
