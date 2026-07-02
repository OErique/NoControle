import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'notifications'
        ) as exists
      `

      if (!tableCheck[0]?.exists) {
        // Table doesn't exist yet, return empty array
        return NextResponse.json([])
      }

      const notifications = await sql`
        SELECT id, user_id, type, title, message, read, action_url, created_at
        FROM notifications
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 20
      `

      return NextResponse.json(notifications)
    } catch (dbError) {
      // If query fails, return empty array instead of error
      console.log("Notifications table not ready:", dbError)
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
