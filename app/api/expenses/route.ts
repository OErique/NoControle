import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { description, amount, categoryId, date, isRecurring, recurrenceType, creditCardId, totalInstallments } = body

    if (!description || !amount) {
      return NextResponse.json({ error: "Descrição e valor são obrigatórios" }, { status: 400 })
    }

    if (creditCardId && totalInstallments && totalInstallments > 1) {
      const installmentGroupId = crypto.randomUUID()
      const installmentAmount = amount / totalInstallments
      const baseDate = new Date(date)
      const results = []

      for (let i = 0; i < totalInstallments; i++) {
        const installmentDate = new Date(baseDate)
        installmentDate.setMonth(installmentDate.getMonth() + i)

        const result = await sql`
          INSERT INTO expenses (
            user_id, category_id, description, amount, date, 
            is_recurring, recurrence_type, credit_card_id,
            installment_number, total_installments, installment_group_id
          )
          VALUES (
            ${user.id}, ${categoryId}, ${`${description} (${i + 1}/${totalInstallments})`}, 
            ${installmentAmount}, ${installmentDate.toISOString().split("T")[0]}, 
            false, null, ${creditCardId},
            ${i + 1}, ${totalInstallments}, ${installmentGroupId}
          )
          RETURNING *
        `
        results.push(result[0])
      }

      await sql`
        UPDATE credit_cards 
        SET current_balance = current_balance + ${amount},
            available_limit = credit_limit - (current_balance + ${amount})
        WHERE id = ${creditCardId} AND user_id = ${user.id}
      `

      return NextResponse.json({
        ...results[0],
        totalInstallmentsCreated: totalInstallments,
        installmentGroupId,
      })
    }

    // Regular expense (no installments)
    const newExpenses = await sql`
      INSERT INTO expenses (
        user_id, category_id, description, amount, date, 
        is_recurring, recurrence_type, credit_card_id
      )
      VALUES (
        ${user.id}, ${categoryId}, ${description}, ${amount}, ${date}, 
        ${isRecurring}, ${recurrenceType}, ${creditCardId || null}
      )
      RETURNING *
    `

    if (creditCardId) {
      await sql`
        UPDATE credit_cards 
        SET current_balance = current_balance + ${amount},
            available_limit = credit_limit - (current_balance + ${amount})
        WHERE id = ${creditCardId} AND user_id = ${user.id}
      `
    }

    // Get category info
    if (categoryId) {
      const categories = await sql`
        SELECT name as category_name, color as category_color
        FROM expense_categories WHERE id = ${categoryId}
      `
      if (categories.length > 0) {
        return NextResponse.json({ ...newExpenses[0], ...categories[0] })
      }
    }

    return NextResponse.json(newExpenses[0])
  } catch (error) {
    console.error("Create expense error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
