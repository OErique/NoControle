import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { learnCategoryMapping } from "@/lib/categorizer"

interface TransactionToImport {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  categoryId: string | null
  selected: boolean
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Check plan access
    const modulesAllowed = user.modules_allowed || 1
    if (modulesAllowed < 2) {
      return NextResponse.json({ error: "Recurso disponível apenas para planos Completo e Total" }, { status: 403 })
    }

    const { transactions, fileName, fileType } = (await request.json()) as {
      transactions: TransactionToImport[]
      fileName: string
      fileType: string
    }

    const selectedTransactions = transactions.filter((t) => t.selected)

    if (selectedTransactions.length === 0) {
      return NextResponse.json({ error: "Nenhuma transação selecionada" }, { status: 400 })
    }

    let importedCount = 0
    let totalIncome = 0
    let totalExpense = 0
    const dates: string[] = []

    // Insert transactions
    for (const transaction of selectedTransactions) {
      dates.push(transaction.date)

      if (transaction.type === "income") {
        await sql`
          INSERT INTO incomes (user_id, category_id, description, amount, date)
          VALUES (${user.id}, ${transaction.categoryId}, ${transaction.description}, ${transaction.amount}, ${transaction.date})
        `
        totalIncome += transaction.amount
      } else {
        await sql`
          INSERT INTO expenses (user_id, category_id, description, amount, date)
          VALUES (${user.id}, ${transaction.categoryId}, ${transaction.description}, ${transaction.amount}, ${transaction.date})
        `
        totalExpense += transaction.amount
      }

      // Learn category mapping for future auto-categorization
      if (transaction.categoryId) {
        await learnCategoryMapping(user.id, transaction.description, transaction.categoryId, transaction.type)
      }

      importedCount++
    }

    // Sort dates
    dates.sort()
    const periodStart = dates[0]
    const periodEnd = dates[dates.length - 1]

    // Record import history
    await sql`
      INSERT INTO import_history (
        user_id, file_name, file_type, total_transactions, 
        imported_transactions, skipped_duplicates,
        total_income, total_expense, period_start, period_end, status
      )
      VALUES (
        ${user.id}, ${fileName}, ${fileType}, ${transactions.length},
        ${importedCount}, ${transactions.length - selectedTransactions.length},
        ${totalIncome}, ${totalExpense}, ${periodStart}, ${periodEnd}, 'completed'
      )
    `

    return NextResponse.json({
      success: true,
      imported: importedCount,
      totalIncome,
      totalExpense,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
