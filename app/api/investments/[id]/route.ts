import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { currentAmount, name, typeId, initialAmount, startDate, notes, institution } = body

    if (currentAmount !== undefined) {
      await sql`
        UPDATE investments 
        SET current_amount = ${currentAmount}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${user.id}
      `
    }

    if (name !== undefined || typeId !== undefined || initialAmount !== undefined) {
      await sql`
        UPDATE investments 
        SET 
          name = COALESCE(${name || null}, name),
          type_id = COALESCE(${typeId || null}, type_id),
          initial_amount = COALESCE(${initialAmount || null}, initial_amount),
          start_date = COALESCE(${startDate || null}, start_date),
          notes = COALESCE(${notes || null}, notes),
          institution = COALESCE(${institution || null}, institution),
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${user.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating investment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await sql`
      DELETE FROM investments WHERE id = ${id} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting investment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
