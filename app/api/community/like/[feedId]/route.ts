import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ feedId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { feedId } = await params

    const feedItem = await sql`
      SELECT user_id FROM social_feed WHERE id = ${feedId}
    `

    if (feedItem.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (feedItem[0].user_id === user.id) {
      return NextResponse.json({ error: "You cannot like your own post" }, { status: 400 })
    }

    const today = new Date().toISOString().split("T")[0]
    const dailyLikes = await sql`
      SELECT count FROM daily_limits 
      WHERE user_id = ${user.id} 
      AND limit_type = 'likes_given' 
      AND limit_date = ${today}
    `

    const currentCount = dailyLikes[0]?.count || 0
    if (currentCount >= 50) {
      return NextResponse.json({ error: "Daily like limit reached (50/day)" }, { status: 429 })
    }

    // Check if already liked
    const existing = await sql`
      SELECT id FROM social_likes
      WHERE user_id = ${user.id} AND feed_id = ${feedId}
    `

    if (existing.length > 0) {
      // Unlike - no points change when unliking
      await sql`DELETE FROM social_likes WHERE user_id = ${user.id} AND feed_id = ${feedId}`
      await sql`UPDATE social_feed SET likes_count = likes_count - 1 WHERE id = ${feedId}`
      return NextResponse.json({ liked: false })
    } else {
      // Like
      await sql`INSERT INTO social_likes (user_id, feed_id) VALUES (${user.id}, ${feedId})`
      await sql`UPDATE social_feed SET likes_count = likes_count + 1 WHERE id = ${feedId}`

      await sql`UPDATE users SET total_points = total_points + 5 WHERE id = ${feedItem[0].user_id}`

      await sql`
        INSERT INTO points_transactions (user_id, amount, transaction_type, source, source_id, description)
        VALUES (${feedItem[0].user_id}, 5, 'earned', 'like_received', ${feedId}, 'Received a like on your post')
      `

      await sql`
        INSERT INTO daily_limits (user_id, limit_type, count, limit_date)
        VALUES (${user.id}, 'likes_given', 1, ${today})
        ON CONFLICT (user_id, limit_type, limit_date)
        DO UPDATE SET count = daily_limits.count + 1
      `

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error("Error liking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
