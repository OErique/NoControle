import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const types = await sql`
      SELECT DISTINCT ON (name) id, name, icon, risk_level
      FROM investment_types
      ORDER BY name, id
    `

    return NextResponse.json({ types })
  } catch (error) {
    console.error("Error fetching investment types:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
