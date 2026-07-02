import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    const result = await sql`
      UPDATE users
      SET name = ${name}, updated_at = NOW()
      WHERE id = ${user.id}
      RETURNING id, name, email
    `

    return NextResponse.json({ user: result[0] })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
