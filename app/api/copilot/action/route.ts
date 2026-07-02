import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

// Intent types the AI can detect
type IntentType =
  | "add_expense"
  | "add_income"
  | "add_bet"
  | "get_summary"
  | "get_balance"
  | "get_expenses"
  | "get_category_expense"
  | "get_net_worth"
  | "get_bets"
  | "get_debts"
  | "get_investments"
  | "get_tip"
  | "unknown"

interface ParsedIntent {
  intent: IntentType
  data: {
    amount?: number
    description?: string
    category?: string
    cardName?: string
    platform?: string
    won?: number
    period?: string
  }
  confidence: number
}

async function parseUserIntent(message: string, userId: string): Promise<ParsedIntent> {
  // Get user context for better parsing
  const [categories, cards] = await Promise.all([
    sql`SELECT id, name FROM expense_categories WHERE user_id = ${userId} OR is_default = true`,
    sql`SELECT id, name FROM credit_cards WHERE user_id = ${userId} AND is_active = true`,
  ])

  const categoryNames = categories.map((c: any) => c.name).join(", ")
  const cardNames = cards.map((c: any) => c.name).join(", ")

  const prompt = `Você é um parser de intenções financeiras. Analise a mensagem do usuário e extraia a intenção.

Mensagem: "${message}"

Categorias disponíveis: ${categoryNames || "Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Compras"}
Cartões disponíveis: ${cardNames || "nenhum"}

Responda APENAS em JSON válido:
{
  "intent": "add_expense" | "add_income" | "add_bet" | "get_summary" | "get_balance" | "get_expenses" | "get_category_expense" | "get_net_worth" | "get_bets" | "get_debts" | "get_investments" | "get_tip" | "unknown",
  "data": {
    "amount": number ou null,
    "description": "string ou null",
    "category": "string ou null (nome da categoria mais próxima)",
    "cardName": "string ou null (nome do cartão se mencionado)",
    "platform": "string ou null (para apostas)",
    "won": number ou null (para apostas - valor ganho),
    "period": "string ou null (hoje, semana, mês, ano)"
  },
  "confidence": 0.0 a 1.0
}

IMPORTANTE - Regras de classificação:
- Palavras como "recebi", "ganhei", "entrou", "salário", "freelance", "dividendos", "renda" → SEMPRE intent: "add_income"
- Palavras como "gastei", "paguei", "comprei", "lancei", "despesa" → SEMPRE intent: "add_expense"

Exemplos:
- "adicione 50 reais de mercado" → intent: add_expense, amount: 50, description: "mercado", category: "Alimentação"
- "lance 120 de uber no nubank" → intent: add_expense, amount: 120, description: "uber", category: "Transporte", cardName: "Nubank"
- "recebi 5000 de salário" → intent: add_income, amount: 5000, description: "salário"
- "recebi 3000 de salário" → intent: add_income, amount: 3000, description: "salário"
- "ganhei 200 de freelance" → intent: add_income, amount: 200, description: "freelance"
- "entrou 150 de dividendos" → intent: add_income, amount: 150, description: "dividendos"
- "apostei 100 e ganhei 250 na bet365" → intent: add_bet, amount: 100, won: 250, platform: "bet365"
- "quanto gastei esse mês?" → intent: get_summary, period: "mês"
- "qual meu maior gasto?" → intent: get_category_expense
- "como está meu patrimônio?" → intent: get_net_worth
- "me dá uma dica" → intent: get_tip`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxOutputTokens: 300,
    })

    // Clean response - remove markdown code blocks if present
    let cleanText = text.trim()
    if (cleanText.startsWith("```")) {
      cleanText = cleanText
        .replace(/```json?\n?/g, "")
        .replace(/```/g, "")
        .trim()
    }

    return JSON.parse(cleanText)
  } catch (error) {
    console.error("Error parsing intent:", error)
    return { intent: "unknown", data: {}, confidence: 0 }
  }
}

async function executeAction(intent: ParsedIntent, userId: string, userPlan: string, gamblingEnabled: boolean) {
  const { intent: intentType, data } = intent

  switch (intentType) {
    case "add_expense": {
      if (!data.amount || !data.description) {
        return {
          success: false,
          message: "Preciso do valor e descrição da despesa. Por exemplo: 'adicione 50 reais de mercado'",
        }
      }

      // Find category
      let categoryId = null
      if (data.category) {
        const cat = await sql`
          SELECT id FROM expense_categories 
          WHERE (user_id = ${userId} OR is_default = true) 
          AND LOWER(name) LIKE ${`%${data.category.toLowerCase()}%`}
          LIMIT 1
        `
        categoryId = cat[0]?.id
      }

      // Find card if mentioned
      let creditCardId = null
      if (data.cardName) {
        const card = await sql`
          SELECT id FROM credit_cards 
          WHERE user_id = ${userId} AND is_active = true
          AND LOWER(name) LIKE ${`%${data.cardName.toLowerCase()}%`}
          LIMIT 1
        `
        creditCardId = card[0]?.id
      }

      const today = new Date().toISOString().split("T")[0]

      const result = await sql`
        INSERT INTO expenses (user_id, category_id, description, amount, date, credit_card_id)
        VALUES (${userId}, ${categoryId}, ${data.description}, ${data.amount}, ${today}, ${creditCardId})
        RETURNING id
      `

      // Update card balance if used
      if (creditCardId) {
        await sql`
          UPDATE credit_cards 
          SET current_balance = current_balance + ${data.amount},
              available_limit = credit_limit - (current_balance + ${data.amount})
          WHERE id = ${creditCardId}
        `
      }

      const cardMsg = creditCardId ? ` no cartão ${data.cardName}` : ""
      const catMsg = data.category ? ` em ${data.category}` : ""
      return {
        success: true,
        message: `Despesa de ${formatCurrency(data.amount)} (${data.description})${catMsg}${cardMsg} adicionada com sucesso!`,
        action: "expense_added",
        data: { id: result[0].id, amount: data.amount, description: data.description },
      }
    }

    case "add_income": {
      if (!data.amount || !data.description) {
        return {
          success: false,
          message: "Preciso do valor e descrição da receita. Por exemplo: 'recebi 5000 de salário'",
        }
      }

      let categoryId = null
      if (data.category) {
        const cat = await sql`
          SELECT id FROM income_categories 
          WHERE (user_id = ${userId} OR is_default = true) 
          AND LOWER(name) LIKE ${`%${data.category.toLowerCase()}%`}
          LIMIT 1
        `
        categoryId = cat[0]?.id
      }

      const today = new Date().toISOString().split("T")[0]

      const result = await sql`
        INSERT INTO incomes (user_id, category_id, description, amount, date)
        VALUES (${userId}, ${categoryId}, ${data.description}, ${data.amount}, ${today})
        RETURNING id
      `

      return {
        success: true,
        message: `Receita de ${formatCurrency(data.amount)} (${data.description}) adicionada com sucesso!`,
        action: "income_added",
        data: { id: result[0].id, amount: data.amount, description: data.description },
      }
    }

    case "add_bet": {
      if (!gamblingEnabled) {
        return {
          success: false,
          message: "O módulo de apostas está desativado. Ative nas configurações para usar essa função.",
        }
      }

      if (!data.amount) {
        return { success: false, message: "Preciso saber quanto você apostou. Por exemplo: 'apostei 100 e ganhei 200'" }
      }

      const today = new Date().toISOString().split("T")[0]

      await sql`
        INSERT INTO gambling_bets (user_id, amount_bet, amount_won, platform, bet_date)
        VALUES (${userId}, ${data.amount}, ${data.won || 0}, ${data.platform || null}, ${today})
      `

      const resultMsg =
        data.won && data.won > data.amount
          ? `Você ganhou ${formatCurrency(data.won - data.amount)}!`
          : data.won === data.amount
            ? "Você recuperou o valor apostado."
            : `Você perdeu ${formatCurrency(data.amount - (data.won || 0))}.`

      return {
        success: true,
        message: `Aposta de ${formatCurrency(data.amount)} registrada. ${resultMsg}`,
        action: "bet_added",
      }
    }

    case "get_summary":
    case "get_balance": {
      const currentMonth = new Date().toISOString().slice(0, 7)

      const [expenses, incomes] = await Promise.all([
        sql`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ${userId} AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}`,
        sql`SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = ${userId} AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}`,
      ])

      const totalExpenses = Number(expenses[0].total)
      const totalIncomes = Number(incomes[0].total)
      const balance = totalIncomes - totalExpenses

      return {
        success: true,
        message: `📊 **Resumo do mês:**\n\n💰 Receitas: ${formatCurrency(totalIncomes)}\n💸 Despesas: ${formatCurrency(totalExpenses)}\n${balance >= 0 ? "✅" : "⚠️"} Saldo: ${formatCurrency(balance)}`,
        action: "query",
      }
    }

    case "get_category_expense": {
      const currentMonth = new Date().toISOString().slice(0, 7)

      const topCategory = await sql`
        SELECT ec.name, COALESCE(SUM(e.amount), 0) as total
        FROM expenses e
        LEFT JOIN expense_categories ec ON e.category_id = ec.id
        WHERE e.user_id = ${userId} AND TO_CHAR(e.date, 'YYYY-MM') = ${currentMonth}
        GROUP BY ec.name
        ORDER BY total DESC
        LIMIT 1
      `

      if (topCategory.length === 0) {
        return { success: true, message: "Você ainda não tem despesas registradas este mês.", action: "query" }
      }

      return {
        success: true,
        message: `Seu maior gasto este mês é **${topCategory[0].name || "Sem categoria"}** com ${formatCurrency(Number(topCategory[0].total))}.`,
        action: "query",
      }
    }

    case "get_net_worth": {
      const [investments, debts, incomes, expenses] = await Promise.all([
        sql`SELECT COALESCE(SUM(current_amount), 0) as total FROM investments WHERE user_id = ${userId} AND status = 'active'`,
        sql`SELECT COALESCE(SUM(current_amount), 0) as total FROM debts WHERE user_id = ${userId} AND status = 'active'`,
        sql`SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = ${userId}`,
        sql`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ${userId}`,
      ])

      const totalInvestments = Number(investments[0].total)
      const totalDebts = Number(debts[0].total)
      const financialBalance = Number(incomes[0].total) - Number(expenses[0].total)
      const netWorth = financialBalance + totalInvestments - totalDebts

      return {
        success: true,
        message: `💎 **Patrimônio Líquido: ${formatCurrency(netWorth)}**\n\n📈 Investimentos: ${formatCurrency(totalInvestments)}\n💳 Dívidas: ${formatCurrency(totalDebts)}\n💰 Saldo acumulado: ${formatCurrency(financialBalance)}`,
        action: "query",
      }
    }

    case "get_bets": {
      if (!gamblingEnabled) {
        return { success: false, message: "O módulo de apostas está desativado." }
      }

      const currentMonth = new Date().toISOString().slice(0, 7)

      const bets = await sql`
        SELECT COALESCE(SUM(amount_bet), 0) as total_bet, COALESCE(SUM(amount_won), 0) as total_won
        FROM gambling_bets
        WHERE user_id = ${userId} AND TO_CHAR(bet_date, 'YYYY-MM') = ${currentMonth}
      `

      const totalBet = Number(bets[0].total_bet)
      const totalWon = Number(bets[0].total_won)
      const balance = totalWon - totalBet

      return {
        success: true,
        message: `🎰 **Apostas do mês:**\n\n💸 Total apostado: ${formatCurrency(totalBet)}\n💰 Total ganho: ${formatCurrency(totalWon)}\n${balance >= 0 ? "✅" : "⚠️"} Saldo: ${formatCurrency(balance)}`,
        action: "query",
      }
    }

    case "get_debts": {
      const debts = await sql`
        SELECT creditor, current_amount, interest_rate
        FROM debts
        WHERE user_id = ${userId} AND status = 'active'
        ORDER BY interest_rate DESC
        LIMIT 5
      `

      if (debts.length === 0) {
        return { success: true, message: "Você não tem dívidas ativas. Parabéns! 🎉", action: "query" }
      }

      const total = debts.reduce((sum: number, d: any) => sum + Number(d.current_amount), 0)
      const debtList = debts
        .map((d: any) => `• ${d.creditor}: ${formatCurrency(Number(d.current_amount))} (${d.interest_rate}% juros)`)
        .join("\n")

      return {
        success: true,
        message: `💳 **Suas dívidas ativas:**\n\n${debtList}\n\n📊 Total: ${formatCurrency(total)}`,
        action: "query",
      }
    }

    case "get_investments": {
      const investments = await sql`
        SELECT name, current_amount, initial_amount
        FROM investments
        WHERE user_id = ${userId} AND status = 'active'
        ORDER BY current_amount DESC
        LIMIT 5
      `

      if (investments.length === 0) {
        return { success: true, message: "Você ainda não tem investimentos. Que tal começar?", action: "query" }
      }

      const total = investments.reduce((sum: number, i: any) => sum + Number(i.current_amount), 0)
      const investList = investments
        .map((i: any) => {
          const gain = Number(i.current_amount) - Number(i.initial_amount)
          const gainPercent = ((gain / Number(i.initial_amount)) * 100).toFixed(1)
          return `• ${i.name}: ${formatCurrency(Number(i.current_amount))} (${gain >= 0 ? "+" : ""}${gainPercent}%)`
        })
        .join("\n")

      return {
        success: true,
        message: `📈 **Seus investimentos:**\n\n${investList}\n\n💎 Total: ${formatCurrency(total)}`,
        action: "query",
      }
    }

    case "get_tip": {
      const tips = [
        "💡 A regra 50/30/20: 50% para necessidades, 30% para desejos e 20% para poupança e investimentos.",
        "💡 Pague primeiro a dívida com maior taxa de juros para economizar mais a longo prazo.",
        "💡 Tenha uma reserva de emergência de 3-6 meses de despesas antes de investir.",
        "💡 Automatize seus investimentos para não depender da disciplina no dia a dia.",
        "💡 Revise suas assinaturas mensais - muitas vezes pagamos por serviços que não usamos.",
        "💡 Antes de comprar algo, espere 24 horas. Se ainda quiser, compre.",
        "💡 Diversifique seus investimentos para reduzir riscos.",
      ]

      return {
        success: true,
        message: tips[Math.floor(Math.random() * tips.length)],
        action: "query",
      }
    }

    default:
      return {
        success: false,
        message:
          "Não entendi sua solicitação. Tente algo como:\n• 'adicione 50 de mercado'\n• 'quanto gastei esse mês?'\n• 'qual meu patrimônio?'",
      }
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get user plan and gambling status
    const userInfo = await sql`
      SELECT u.gambling_enabled, p.slug as plan_slug
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.id = ${user.id}
    `

    const planSlug = userInfo[0]?.plan_slug || "essencial"
    const gamblingEnabled = userInfo[0]?.gambling_enabled || false

    // Parse intent
    const intent = await parseUserIntent(message, user.id)

    // Execute action
    const result = await executeAction(intent, user.id, planSlug, gamblingEnabled)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in copilot action:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
