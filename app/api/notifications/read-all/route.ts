import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`
      UPDATE notifications
      SET read = true
      WHERE user_id = ${user.id} AND read = false
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark all as read error:", error)
    return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 })
  }
}
