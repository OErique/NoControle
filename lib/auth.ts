import { sql } from "./db"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production")
  }

  return new TextEncoder().encode(secret || "development-secret-change-before-deploy")
}

export async function createToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getJwtSecret())

  return token
}

export async function verifyToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const users = await sql`
    SELECT u.*, p.name as plan_name, p.modules_allowed, p.features
    FROM users u
    LEFT JOIN plans p ON u.plan_id = p.id
    WHERE u.id = ${payload.userId}
  `

  if (users.length === 0) return null

  const user = users[0]
  // Remove password hash from response
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("auth_token")
}

export async function verifyAuth(request: Request) {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...val] = c.split("=")
      return [key, val.join("=")]
    }),
  )

  const token = cookies["auth_token"]
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  const users = await sql`
    SELECT u.*, p.name as plan_name, p.modules_allowed, p.price as plan_price
    FROM users u
    LEFT JOIN plans p ON u.plan_id = p.id
    WHERE u.id = ${payload.userId}
  `

  if (users.length === 0) return null

  const user = users[0]
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}
