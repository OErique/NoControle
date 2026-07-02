import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { theme } = await request.json()

    if (!["light", "dark", "system"].includes(theme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 })
    }

    await sql`UPDATE users SET theme_preference = ${theme} WHERE id = ${user.id}`

    return NextResponse.json({ success: true, theme })
  } catch (error) {
    console.error("Error updating theme:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
