import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const allowedFields = [
      "is_public",
      "show_level",
      "show_badges",
      "show_streaks",
      "show_challenges",
      "allow_comments",
      "allow_tips_requests",
    ]

    // Filter only allowed fields
    const updates: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && typeof value === "boolean") {
        updates[key] = value
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Check if profile exists
    const profiles = await sql`SELECT id FROM user_profiles WHERE user_id = ${user.id}`

    if (profiles.length === 0) {
      // Create profile with defaults
      await sql`
        INSERT INTO user_profiles (user_id, is_public, show_level, show_badges, show_streaks, show_challenges, allow_comments)
        VALUES (${user.id}, true, true, true, true, true, true)
      `
    }

    // Build dynamic update query
    const setClause = Object.entries(updates)
      .map(([key, _]) => `${key} = ${updates[key]}`)
      .join(", ")

    // We need to update each field individually since we can't use dynamic column names easily
    for (const [key, value] of Object.entries(updates)) {
      if (key === "is_public") {
        await sql`UPDATE user_profiles SET is_public = ${value}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${user.id}`
      } else if (key === "show_level") {
        await sql`UPDATE user_profiles SET show_level = ${value}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${user.id}`
      } else if (key === "show_badges") {
        await sql`UPDATE user_profiles SET show_badges = ${value}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${user.id}`
      } else if (key === "show_streaks") {
        await sql`UPDATE user_profiles SET show_streaks = ${value}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${user.id}`
      } else if (key === "show_challenges") {
        await sql`UPDATE user_profiles SET show_challenges = ${value}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${user.id}`
      } else if (key === "allow_comments") {
        await sql`UPDATE user_profiles SET allow_comments = ${value}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ${user.id}`
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating privacy:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
