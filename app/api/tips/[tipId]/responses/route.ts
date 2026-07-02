import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ tipId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tipId } = await params

    const responses = await sql`
      SELECT 
        tr.*,
        u.name as user_name,
        u.avatar_url as user_avatar,
        u.total_points as user_points,
        EXISTS(
          SELECT 1 FROM tip_helpful_votes thv 
          WHERE thv.response_id = tr.id AND thv.user_id = ${user.id}
        ) as is_helpful
      FROM tip_responses tr
      JOIN users u ON u.id = tr.user_id
      WHERE tr.tip_id = ${tipId}
      ORDER BY tr.helpful_votes DESC, tr.created_at ASC
    `

    // Increment view count
    await sql`UPDATE tips SET views_count = views_count + 1 WHERE id = ${tipId}`

    return NextResponse.json({ responses })
  } catch (error) {
    console.error("Error fetching responses:", error)
    return NextResponse.json({ responses: [] })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tipId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tipId } = await params
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Create response
    const result = await sql`
      INSERT INTO tip_responses (tip_id, user_id, content, points_earned)
      VALUES (${tipId}, ${user.id}, ${content}, 10)
      RETURNING *
    `

    // Update tip responses count and mark as answered
    await sql`UPDATE tips SET is_answered = true, responses_count = COALESCE(responses_count, 0) + 1 WHERE id = ${tipId}`

    // Award points
    await sql`UPDATE users SET total_points = COALESCE(total_points, 0) + 10 WHERE id = ${user.id}`

    // Log points
    try {
      await sql`
        INSERT INTO user_points (user_id, points, action_type, description)
        VALUES (${user.id}, 10, 'tip_response', 'Respondeu uma dica')
      `
    } catch (e) {
      // Ignore if table doesn't exist
    }

    return NextResponse.json({
      response: {
        ...result[0],
        user_name: user.name || "Usuário",
        user_avatar: user.avatar_url || null,
        user_points: user.total_points || 0,
        helpful_votes: 0,
        is_helpful: false,
      },
    })
  } catch (error) {
    console.error("Error creating response:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
