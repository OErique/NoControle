import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if tips table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tips'
      )
    `

    if (!tableCheck[0]?.exists) {
      return NextResponse.json({ tips: [] })
    }

    const tips = await sql`
      SELECT 
        t.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        u.total_points as user_points,
        (SELECT COUNT(*) FROM tip_responses tr WHERE tr.tip_id = t.id) as responses_count
      FROM tips t
      JOIN users u ON u.id = t.user_id
      ORDER BY t.created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ tips })
  } catch (error) {
    console.error("Error fetching tips:", error)
    return NextResponse.json({ tips: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, category } = await request.json()

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO tips (user_id, title, content, category)
      VALUES (${user.id}, ${title}, ${content}, ${category})
      RETURNING *
    `

    return NextResponse.json({
      tip: {
        ...result[0],
        user_name: user.name,
        user_avatar: null,
        user_points: 0,
        responses_count: 0,
      },
    })
  } catch (error) {
    console.error("Error creating tip:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
