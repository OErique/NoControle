import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { parseFile, type ParsedTransaction } from "@/lib/parsers"
import { sql } from "@/lib/db"

const MAX_FILE_SIZE = 10 * 1024 * 1024

const DEFAULT_PATTERNS: Record<string, { pattern: RegExp; categoryName: string }[]> = {
  expense: [
    { pattern: /supermercado|mercado|carrefour|extra|pao de acucar|assai/i, categoryName: "Alimentação" },
    { pattern: /uber|99|taxi|cabify|posto|shell|ipiranga|br\s|combustivel/i, categoryName: "Transporte" },
    { pattern: /netflix|spotify|amazon prime|disney|hbo|youtube/i, categoryName: "Lazer" },
    { pattern: /farmacia|drogaria|droga/i, categoryName: "Saúde" },
    { pattern: /restaurante|ifood|rappi|burger|pizza|lanche/i, categoryName: "Alimentação" },
    { pattern: /luz|energia|eletricidade|cpfl|enel|cemig/i, categoryName: "Moradia" },
    { pattern: /agua|saneamento|sabesp|copasa/i, categoryName: "Moradia" },
    { pattern: /internet|telefone|celular|vivo|claro|tim|oi/i, categoryName: "Moradia" },
    { pattern: /academia|gym|smart fit/i, categoryName: "Saúde" },
  ],
  income: [
    { pattern: /salario|pagamento|folha/i, categoryName: "Salário" },
    { pattern: /freelance|freela|projeto/i, categoryName: "Freelance" },
    { pattern: /dividendo|rendimento|juros/i, categoryName: "Investimentos" },
    { pattern: /aluguel|locacao/i, categoryName: "Aluguel" },
  ],
}

function categorizeByPattern(
  description: string,
  type: "income" | "expense",
  categories: { id: number; name: string }[],
): { categoryId: number | null; categoryName: string } {
  const patterns = DEFAULT_PATTERNS[type] || []

  for (const { pattern, categoryName } of patterns) {
    if (pattern.test(description)) {
      const category = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
      if (category) {
        return { categoryId: category.id, categoryName: category.name }
      }
    }
  }

  // Default category
  const defaultName = type === "expense" ? "Outros" : "Outros"
  const defaultCategory = categories.find((c) => c.name.toLowerCase() === defaultName.toLowerCase())
  return {
    categoryId: defaultCategory?.id || null,
    categoryName: defaultCategory?.name || defaultName,
  }
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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo: 10MB" }, { status: 400 })
    }

    // Get file extension
    const fileName = file.name
    const extension = fileName.split(".").pop()?.toLowerCase() || ""
    const allowedExtensions = ["xlsx", "xls", "ofx"]

    if (!allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: `Formato não suportado: ${extension}. Use apenas XLSX ou OFX.` },
        { status: 400 },
      )
    }

    let content: string | ArrayBuffer
    let transactions: ParsedTransaction[]

    try {
      if (extension === "xlsx" || extension === "xls") {
        // Excel files need ArrayBuffer
        content = await file.arrayBuffer()
        transactions = await parseFile(content, extension)
      } else {
        // Text-based files
        content = await file.text()
        transactions = await parseFile(content, extension)
      }
    } catch (parseError) {
      console.error("Parse error:", parseError)
      return NextResponse.json({ error: "Erro ao processar arquivo. Verifique o formato." }, { status: 400 })
    }

    if (transactions.length === 0) {
      return NextResponse.json({ error: "Nenhuma transação encontrada no arquivo" }, { status: 400 })
    }

    const [existingIncomes, existingExpenses, expenseCategories, incomeCategories] = await Promise.all([
      sql`SELECT date::text, description, amount::float FROM incomes WHERE user_id = ${user.id}`,
      sql`SELECT date::text, description, amount::float FROM expenses WHERE user_id = ${user.id}`,
      sql`SELECT id, name, color FROM expense_categories WHERE is_default = true OR user_id = ${user.id} ORDER BY name`,
      sql`SELECT id, name, color FROM income_categories WHERE is_default = true OR user_id = ${user.id} ORDER BY name`,
    ])

    const enrichedTransactions = transactions.map((t) => {
      const categories = t.type === "income" ? incomeCategories : expenseCategories
      const { categoryId, categoryName } = categorizeByPattern(
        t.description,
        t.type,
        categories as { id: number; name: string }[],
      )

      // Check if duplicate
      const existingList = t.type === "income" ? existingIncomes : existingExpenses
      const isDuplicate = existingList.some(
        (e: { date: string; description: string; amount: number }) =>
          e.date === t.date &&
          e.description.toLowerCase().includes(t.description.toLowerCase().substring(0, 10)) &&
          Math.abs(e.amount - t.amount) < 0.01,
      )

      return {
        ...t,
        categoryId,
        categoryName,
        isDuplicate,
        selected: !isDuplicate,
      }
    })

    // Calculate summary
    const uniqueTransactions = enrichedTransactions.filter((t) => !t.isDuplicate)
    const duplicates = enrichedTransactions.filter((t) => t.isDuplicate)
    const totalIncome = uniqueTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = uniqueTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    // Get period
    const dates = transactions
      .map((t) => new Date(t.date))
      .filter((d) => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime())
    const periodStart = dates[0]?.toISOString().split("T")[0] || null
    const periodEnd = dates[dates.length - 1]?.toISOString().split("T")[0] || null

    return NextResponse.json({
      transactions: enrichedTransactions,
      summary: {
        total: transactions.length,
        unique: uniqueTransactions.length,
        duplicates: duplicates.length,
        totalIncome,
        totalExpense,
        periodStart,
        periodEnd,
      },
      categories: {
        expense: expenseCategories,
        income: incomeCategories,
      },
      fileName,
      fileType: extension,
    })
  } catch (error) {
    console.error("Parse error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
