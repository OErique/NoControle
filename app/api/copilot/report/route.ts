import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Check if user has Total plan
    if (user.plan_slug !== "total") {
      return NextResponse.json(
        {
          error: "Relatórios PDF disponíveis apenas no Plano Total",
        },
        { status: 403 },
      )
    }

    const { type, month } = await req.json()

    // Get financial data for the report
    const currentMonth = month || new Date().toISOString().slice(0, 7)

    const [incomes, expenses, debts, investments] = await Promise.all([
      sql`
        SELECT SUM(amount)::float as total, COUNT(*) as count
        FROM incomes 
        WHERE user_id = ${user.id} 
        AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}
      `,
      sql`
        SELECT 
          SUM(e.amount)::float as total, 
          COUNT(*) as count,
          ec.name as category,
          SUM(e.amount)::float as category_total
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        WHERE e.user_id = ${user.id} 
        AND TO_CHAR(e.date, 'YYYY-MM') = ${currentMonth}
        GROUP BY ec.name
      `,
      sql`
        SELECT SUM(current_amount)::float as total, COUNT(*) as count
        FROM debts WHERE user_id = ${user.id} AND status = 'active'
      `,
      sql`
        SELECT SUM(current_amount)::float as total, COUNT(*) as count
        FROM investments WHERE user_id = ${user.id}
      `,
    ])

    const totalIncome = incomes[0]?.total || 0
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.category_total || 0), 0)
    const totalDebts = debts[0]?.total || 0
    const totalInvestments = investments[0]?.total || 0
    const balance = totalIncome - totalExpenses

    // Generate AI analysis
    const { text: analysis } = await generateText({
      model: "openai/gpt-4o-mini",
      system: `Você é um consultor financeiro. Analise os dados e forneça insights práticos em português brasileiro.`,
      prompt: `Analise estes dados financeiros do mês ${currentMonth}:
      - Receita: ${formatCurrency(totalIncome)}
      - Despesas: ${formatCurrency(totalExpenses)}
      - Saldo: ${formatCurrency(balance)}
      - Dívidas ativas: ${formatCurrency(totalDebts)}
      - Investimentos: ${formatCurrency(totalInvestments)}
      
      Categorias de gastos:
      ${expenses.map((e) => `- ${e.category}: ${formatCurrency(e.category_total)}`).join("\n")}
      
      Forneça uma análise concisa com:
      1. Avaliação geral (1-2 frases)
      2. Ponto positivo principal
      3. Área de atenção
      4. Uma sugestão prática`,
      maxOutputTokens: 400,
    })

    // Build report data
    const reportData = {
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan_name,
      },
      period: currentMonth,
      generatedAt: new Date().toISOString(),
      summary: {
        income: { total: totalIncome, count: incomes[0]?.count || 0 },
        expenses: { total: totalExpenses, count: expenses.length },
        balance,
        debts: { total: totalDebts, count: debts[0]?.count || 0 },
        investments: { total: totalInvestments, count: investments[0]?.count || 0 },
      },
      expensesByCategory: expenses.map((e) => ({
        category: e.category || "Outros",
        total: e.category_total || 0,
        percentage: totalExpenses > 0 ? (((e.category_total || 0) / totalExpenses) * 100).toFixed(1) : 0,
      })),
      aiAnalysis: analysis,
      metrics: {
        savingsRate: totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0,
        debtToIncome: totalIncome > 0 ? ((totalDebts / (totalIncome * 12)) * 100).toFixed(1) : 0,
        netWorth: totalInvestments - totalDebts,
      },
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Report generation error:", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}
