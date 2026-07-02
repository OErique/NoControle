import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bio, name } = await request.json()

    // Update name in users table if provided
    if (name !== undefined) {
      await sql`UPDATE users SET name = ${name}, updated_at = CURRENT_TIMESTAMP WHERE id = ${user.id}`
    }

    // Check if profile exists
    const profiles = await sql`SELECT id FROM user_profiles WHERE user_id = ${user.id}`

    if (profiles.length === 0) {
      // Create profile
      await sql`
        INSERT INTO user_profiles (user_id, bio)
        VALUES (${user.id}, ${bio || null})
      `
    } else {
      // Update profile
      await sql`
        UPDATE user_profiles 
        SET bio = ${bio || null}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${user.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
