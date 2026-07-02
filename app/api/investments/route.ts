import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const investments = await sql`
      SELECT 
        i.id, i.name, i.type_id, it.name as type_name, it.icon as type_icon,
        i.initial_amount, i.current_amount, i.start_date, i.notes, i.institution
      FROM investments i
      JOIN investment_types it ON i.type_id = it.id
      WHERE i.user_id = ${user.id}
      ORDER BY i.current_amount DESC
    `

    const stats = investments.reduce(
      (acc, inv) => {
        acc.total_invested += Number.parseFloat(inv.initial_amount || 0)
        acc.current_value += Number.parseFloat(inv.current_amount || 0)
        return acc
      },
      { total_invested: 0, current_value: 0, total_return: 0, return_percentage: 0 },
    )

    stats.total_return = stats.current_value - stats.total_invested
    stats.return_percentage = stats.total_invested > 0 ? (stats.total_return / stats.total_invested) * 100 : 0

    return NextResponse.json({ investments, stats })
  } catch (error) {
    console.error("Error fetching investments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, typeId, initialAmount, currentAmount, startDate, notes, institution } = body

    if (!name || !typeId || !initialAmount) {
      return NextResponse.json({ error: "Nome, tipo e valor inicial são obrigatórios" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO investments (
        user_id, name, type_id, initial_amount, current_amount, 
        start_date, notes, institution, status
      )
      VALUES (
        ${user.id}, ${name}, ${typeId}, ${initialAmount}, 
        ${currentAmount || initialAmount}, ${startDate || new Date().toISOString().split("T")[0]}, 
        ${notes || null}, ${institution || null}, 'active'
      )
      RETURNING *
    `

    return NextResponse.json({ investment: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating investment:", error)
    return NextResponse.json({ error: "Erro ao criar investimento" }, { status: 500 })
  }
}
