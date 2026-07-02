import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const plans = await sql`
      SELECT id, name, slug, price, modules_allowed, features
      FROM plans
      ORDER BY price ASC
    `

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Error fetching plans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
