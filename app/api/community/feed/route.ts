import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if social_feed table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'social_feed'
      )
    `

    if (!tableCheck[0]?.exists) {
      return NextResponse.json({ items: [] })
    }

    const items = await sql`
      SELECT 
        sf.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        u.total_points as user_points,
        EXISTS(
          SELECT 1 FROM social_likes sl 
          WHERE sl.feed_id = sf.id AND sl.user_id = ${user.id}
        ) as is_liked
      FROM social_feed sf
      JOIN users u ON u.id = sf.user_id
      JOIN user_profiles up ON up.user_id = sf.user_id
      WHERE sf.is_public = true AND up.is_public = true
      ORDER BY sf.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching feed:", error)
    return NextResponse.json({ items: [] })
  }
}
