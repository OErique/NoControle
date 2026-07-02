import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan_id } = await request.json()

    // Update user's plan
    await sql`
      UPDATE users
      SET plan_id = ${plan_id}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error upgrading plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
