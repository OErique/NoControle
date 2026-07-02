import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { monthlyLimit } = body

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_gambling_settings'
      )
    `

    if (!tableCheck[0]?.exists) {
      // Create table if not exists
      await sql`
        CREATE TABLE IF NOT EXISTS user_gambling_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          monthly_limit DECIMAL(12,2) DEFAULT 500,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id)
        )
      `
    }

    // Upsert settings
    await sql`
      INSERT INTO user_gambling_settings (user_id, monthly_limit, updated_at)
      VALUES (${user.id}, ${monthlyLimit}, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET monthly_limit = ${monthlyLimit}, updated_at = NOW()
    `

    return NextResponse.json({ success: true, monthlyLimit })
  } catch (error) {
    console.error("Error updating gambling settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
