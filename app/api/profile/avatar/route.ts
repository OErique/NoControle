import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, GIF or WebP" }, { status: 400 })
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum 2MB" }, { status: 400 })
    }

    // Convert to base64 for simple storage (in production, use cloud storage)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`

    // Update user avatar
    await sql`UPDATE users SET avatar_url = ${base64} WHERE id = ${user.id}`

    return NextResponse.json({ success: true, avatar_url: base64 })
  } catch (error) {
    console.error("Error uploading avatar:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`UPDATE users SET avatar_url = NULL WHERE id = ${user.id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing avatar:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
