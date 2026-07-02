import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { borderId, themeId } = await request.json()

    // Verify ownership if setting a border
    if (borderId) {
      const owned = await sql`
        SELECT id FROM user_purchases 
        WHERE user_id = ${user.id} AND item_id = ${borderId}
      `
      if (owned.length === 0) {
        return NextResponse.json({ error: "You don't own this border" }, { status: 400 })
      }
      await sql`UPDATE users SET selected_border_id = ${borderId} WHERE id = ${user.id}`
    }

    // Verify ownership if setting a theme
    if (themeId) {
      const owned = await sql`
        SELECT id FROM user_purchases 
        WHERE user_id = ${user.id} AND item_id = ${themeId}
      `
      if (owned.length === 0) {
        return NextResponse.json({ error: "You don't own this theme" }, { status: 400 })
      }
      await sql`UPDATE users SET selected_theme_id = ${themeId} WHERE id = ${user.id}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error customizing profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
