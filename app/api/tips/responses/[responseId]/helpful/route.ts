import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ responseId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { responseId } = await params

    // Check if already voted
    const existing = await sql`
      SELECT id FROM tip_helpful_votes
      WHERE user_id = ${user.id} AND response_id = ${responseId}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Already voted" }, { status: 400 })
    }

    // Add vote
    await sql`
      INSERT INTO tip_helpful_votes (user_id, response_id)
      VALUES (${user.id}, ${responseId})
    `

    // Update response
    await sql`
      UPDATE tip_responses 
      SET helpful_votes = helpful_votes + 1
      WHERE id = ${responseId}
    `

    // Get response author and award bonus points
    const response = await sql`SELECT user_id FROM tip_responses WHERE id = ${responseId}`
    if (response.length > 0) {
      await sql`UPDATE users SET total_points = COALESCE(total_points, 0) + 20 WHERE id = ${response[0].user_id}`
      await sql`
        INSERT INTO user_points (user_id, points, action_type, description)
        VALUES (${response[0].user_id}, 20, 'helpful_response', 'Resposta marcada como útil')
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking helpful:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
