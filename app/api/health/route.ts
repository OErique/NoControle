import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "nocontrole",
    databaseConfigured: Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL),
    timestamp: new Date().toISOString(),
  })
}
