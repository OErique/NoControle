import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { verifyPassword, hashPassword } from "@/lib/auth-password"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    // Get current password hash
    const users = await sql`
      SELECT password_hash FROM users WHERE id = ${user.id}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isValid = await verifyPassword(currentPassword, users[0].password_hash)
    if (!isValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    const newHash = await hashPassword(newPassword)

    await sql`
      UPDATE users
      SET password_hash = ${newHash}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
