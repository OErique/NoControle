import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get top users by points (only public profiles)
    const users = await sql`
      SELECT 
        u.id,
        u.name,
        u.avatar_url,
        u.total_points
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE up.is_public = true OR up.is_public IS NULL
      ORDER BY u.total_points DESC NULLS LAST
      LIMIT 20
    `

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching ranking:", error)
    return NextResponse.json({ users: [] })
  }
}
