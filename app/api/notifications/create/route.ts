import { NextResponse } from "next/server"
import { sql } from "@/lib/db"


// Helper function to create notifications
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string,
) {
  try {
    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      )
    `

    if (!tableCheck[0]?.exists) {
      console.log("Notifications table does not exist")
      return null
    }

    const result = await sql`
      INSERT INTO notifications (user_id, type, title, message, action_url, read)
      VALUES (${userId}, ${type}, ${title}, ${message}, ${actionUrl || null}, false)
      RETURNING *
    `

    return result[0]
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { userId, type, title, message, actionUrl } = await request.json()

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const notification = await createNotification(userId, type, title, message, actionUrl)

    if (notification) {
      return NextResponse.json({ notification })
    } else {
      return NextResponse.json({ error: "Falha ao criar notificação" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in create notification route:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
