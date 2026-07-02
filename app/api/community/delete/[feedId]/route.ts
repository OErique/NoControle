import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ feedId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { feedId } = await params

    // Verify ownership
    const feedItem = await sql`
      SELECT user_id FROM community_feed WHERE id = ${feedId}
    `

    if (feedItem.length === 0) {
      return NextResponse.json({ error: "Publicação não encontrada" }, { status: 404 })
    }

    if (feedItem[0].user_id !== user.id) {
      return NextResponse.json({ error: "Você só pode excluir suas próprias publicações" }, { status: 403 })
    }

    // Delete the feed item (likes and comments will be cascade deleted)
    await sql`DELETE FROM community_feed WHERE id = ${feedId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting feed item:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
