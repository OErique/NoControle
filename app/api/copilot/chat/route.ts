import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getCurrentUser } from "@/lib/auth"
import { sql } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"

const SYSTEM_PROMPT = `Você é Alfred, um assistente financeiro pessoal inteligente e prestativo.

## Sua Personalidade:
- Você é brasileiro, educado e acessível
- Fala de forma natural, nem muito formal nem muito casual
- Use linguagem simples e direta, sem termos técnicos desnecessários
- Seja gentil e empático com os problemas financeiros do usuário
- Para saudações como "oi", "olá", "eae", responda de forma amigável: "Olá! Como posso ajudar?" ou "Oi! Em que posso ser útil?"
- Pode usar expressões como "beleza", "tranquilo", "certo" de forma natural, mas sem exagero
- NUNCA use emojis
- Respostas CONCISAS - máximo 2-3 frases para perguntas simples
- Para perguntas complexas, explique de forma clara e organizada
- Trate o usuário com respeito, sem ser formal demais

## Sobre o App (NoControle):
App completo de gestão financeira pessoal com:
- Controle de despesas e receitas por categorias
- Gestão de dívidas com acompanhamento de pagamentos
- Investimentos com rentabilidade e evolução
- Cartões de crédito com faturas e limites
- Metas financeiras com progresso visual
- Módulo de apostas opcional (precisa ativar nas configurações)
- Perfil compartilhado para casais (plano Total)
- Sistema de pontos, níveis e conquistas
- Comunidade para trocar dicas
- Importação de extratos bancários
- Relatórios em PDF

## Planos Disponíveis:
1. Essencial (Grátis): Funções básicas de controle financeiro
2. Completo (R$9,90/mês): Recursos avançados, relatórios, metas ilimitadas
3. Total (R$19,90/mês): Tudo liberado + assistente por voz + perfil casal

## Suas Capacidades:
Você pode executar ações reais no app:
- Adicionar despesas: "gastei 50 de mercado", "paguei 100 de luz"
- Adicionar receitas: "recebi 3000 de salário", "entrou 500 de freelance"
- Registrar apostas (se ativado): "apostei 20 e ganhei 50"
- Consultar saldo, gastos, patrimônio
- Dar dicas de economia personalizadas
- Explicar funcionalidades do app

## Formato de Respostas:
- Para ações executadas: Confirme brevemente o que foi feito
- Para consultas: Mostre os números de forma clara
- Para dúvidas: Explique de forma simples e direta
- Para dicas: Seja prático e personalizado

## Contexto Financeiro do Usuário:
{USER_CONTEXT}

Lembre-se: seja útil, direto e humano. Nada de parecer um robô!`

const ALFRED_MODEL = process.env.ALFRED_MODEL || "openai/gpt-4o-mini"

async function getUserFinancialContext(userId: string) {
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [userInfo, monthlyExpenses, monthlyIncomes, totalDebts, totalInvestments, recentExpenses, goals, cards] =
    await Promise.all([
      sql`
      SELECT u.name, u.total_points, u.gambling_enabled, p.name as plan_name, p.slug as plan_slug,
             ul.name as level_name
      FROM users u
      LEFT JOIN plans p ON u.plan_id = p.id
      LEFT JOIN user_levels ul ON u.current_level_id = ul.id
      WHERE u.id = ${userId}
    `,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ${userId} AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = ${userId} AND TO_CHAR(date, 'YYYY-MM') = ${currentMonth}`,
      sql`SELECT COALESCE(SUM(current_amount), 0) as total FROM debts WHERE user_id = ${userId} AND status = 'active'`,
      sql`SELECT COALESCE(SUM(current_amount), 0) as total FROM investments WHERE user_id = ${userId} AND status = 'active'`,
      sql`
      SELECT e.description, e.amount, ec.name as category 
      FROM expenses e 
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      WHERE e.user_id = ${userId} 
      ORDER BY e.date DESC 
      LIMIT 5
    `,
      sql`SELECT name, target_amount, current_amount FROM financial_goals WHERE user_id = ${userId} AND status = 'active' LIMIT 3`,
      sql`SELECT name, credit_limit, current_balance FROM credit_cards WHERE user_id = ${userId} AND is_active = true`,
    ])

  const user = userInfo[0] || {}
  const expenses = Number(monthlyExpenses[0]?.total) || 0
  const incomes = Number(monthlyIncomes[0]?.total) || 0
  const debts = Number(totalDebts[0]?.total) || 0
  const investments = Number(totalInvestments[0]?.total) || 0
  const balance = incomes - expenses
  const netWorth = balance + investments - debts

  return `
Nome: ${user.name || "Usuário"}
Plano: ${user.plan_name || "Essencial"}
Nível: ${user.level_name || "Iniciante"} (${user.total_points || 0} pontos)
Módulo de Apostas: ${user.gambling_enabled ? "Ativo" : "Desativado"}

Resumo do Mês Atual:
- Receitas: ${formatCurrency(incomes)}
- Despesas: ${formatCurrency(expenses)}
- Saldo do mês: ${formatCurrency(balance)}

Patrimônio Total: ${formatCurrency(netWorth)}
- Investimentos: ${formatCurrency(investments)}
- Dívidas: ${formatCurrency(debts)}

Últimos gastos: ${recentExpenses.map((e: any) => `${e.description} (${formatCurrency(Number(e.amount))})`).join(", ") || "Nenhum registrado"}
Metas ativas: ${goals.length > 0 ? goals.map((g: any) => `${g.name} (${Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)}%)`).join(", ") : "Nenhuma"}
Cartões: ${cards.length > 0 ? cards.map((c: any) => `${c.name} (usado: ${formatCurrency(Number(c.current_balance))})`).join(", ") : "Nenhum cadastrado"}
`.trim()
}

async function detectAndExecuteAction(message: string, userId: string, gamblingEnabled: boolean) {
  const lowerMessage = message.toLowerCase()

  // Detectar adição de despesa
  const expensePatterns = [
    /(?:adicione?|coloque?|lanc[ea]|registr[ea])\s*(?:uma?\s*)?(?:despesa\s*de\s*)?(?:r?\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?\s*)?(?:de\s*|em\s*|no\s*)?(.+)/i,
    /(?:gastei|paguei)\s*(?:r?\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?\s*)?(?:de\s*|em\s*|no\s*|com\s*)?(.+)/i,
    /(\d+(?:[.,]\d{2})?)\s*(?:reais?\s*)?(?:de\s*|em\s*|no\s*|com\s*)(.+)/i,
  ]

  for (const pattern of expensePatterns) {
    const match = lowerMessage.match(pattern)
    if (match) {
      const amount = Number.parseFloat(match[1].replace(",", "."))
      const description = match[2]
        .trim()
        .replace(
          /(?:no\s+)?(?:cart[aã]o\s+)?(?:do\s+)?(nubank|inter|ita[uú]|bradesco|santander|c6|next|original|pan|bmg|neon|picpay|mercado pago)/gi,
          "",
        )
        .trim()

      if (!description || description.length < 2) continue

      // Verificar se é no cartão
      const cardMatch = lowerMessage.match(
        /(?:no\s+)?(?:cart[aã]o\s+)?(?:do\s+)?(nubank|inter|ita[uú]|bradesco|santander|c6|next|original|pan|bmg|neon|picpay|mercado pago)/i,
      )
      let creditCardId = null
      let cardName = null

      if (cardMatch) {
        const card = await sql`
          SELECT id, name FROM credit_cards 
          WHERE user_id = ${userId} AND is_active = true
          AND LOWER(name) LIKE ${`%${cardMatch[1].toLowerCase()}%`}
          LIMIT 1
        `
        if (card[0]) {
          creditCardId = card[0].id
          cardName = card[0].name
        }
      }

      // Categorização automática
      const categories =
        await sql`SELECT id, name FROM expense_categories WHERE user_id = ${userId} OR is_default = true`
      let categoryId = null
      let categoryName = null

      const categoryKeywords: Record<string, string[]> = {
        alimentação: [
          "mercado",
          "supermercado",
          "ifood",
          "restaurante",
          "lanche",
          "comida",
          "almoço",
          "jantar",
          "café",
          "padaria",
        ],
        transporte: ["uber", "99", "gasolina", "combustível", "estacionamento", "pedágio", "ônibus", "metrô", "taxi"],
        moradia: ["aluguel", "condomínio", "luz", "água", "gás", "internet", "iptu", "energia"],
        saúde: ["farmácia", "remédio", "médico", "consulta", "exame", "academia", "dentista"],
        lazer: ["netflix", "spotify", "cinema", "show", "jogo", "viagem", "bar", "festa"],
        educação: ["curso", "livro", "faculdade", "escola", "inglês", "material"],
        compras: ["roupa", "sapato", "celular", "eletrônico", "presente", "loja"],
      }

      for (const [catName, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some((k) => description.toLowerCase().includes(k))) {
          const cat = categories.find((c: any) => c.name.toLowerCase().includes(catName))
          if (cat) {
            categoryId = cat.id
            categoryName = cat.name
            break
          }
        }
      }

      const today = new Date().toISOString().split("T")[0]

      await sql`
        INSERT INTO expenses (user_id, category_id, description, amount, date, credit_card_id)
        VALUES (${userId}, ${categoryId}, ${description}, ${amount}, ${today}, ${creditCardId})
      `

      if (creditCardId) {
        await sql`
          UPDATE credit_cards 
          SET current_balance = current_balance + ${amount},
              available_limit = credit_limit - (current_balance + ${amount})
          WHERE id = ${creditCardId}
        `
      }

      return {
        executed: true,
        action: "expense_added",
        details: { amount, description, category: categoryName, card: cardName },
      }
    }
  }

  // Detectar adição de receita
  const incomePatterns = [
    /(?:recebi|ganhei|entrou)\s*(?:r?\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?\s*)?(?:de\s*|do\s*)?(.+)/i,
    /(?:adicione?|lanc[ea])\s*(?:uma?\s*)?(?:receita\s*de\s*)?(?:r?\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?\s*)?(?:de\s*)?(.+)/i,
  ]

  for (const pattern of incomePatterns) {
    const match = lowerMessage.match(pattern)
    if (match) {
      const amount = Number.parseFloat(match[1].replace(",", "."))
      const description = match[2].trim()

      if (!description || description.length < 2) continue

      const today = new Date().toISOString().split("T")[0]

      await sql`
        INSERT INTO incomes (user_id, description, amount, date)
        VALUES (${userId}, ${description}, ${amount}, ${today})
      `

      return {
        executed: true,
        action: "income_added",
        details: { amount, description },
      }
    }
  }

  // Detectar registro de aposta
  if (gamblingEnabled) {
    const betPattern =
      /(?:apostei|joguei)\s*(?:r?\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?\s*)?(?:e\s*)?(?:ganhei|perdi)?\s*(?:r?\$?\s*)?(\d+(?:[.,]\d{2})?)?/i
    const match = lowerMessage.match(betPattern)
    if (match) {
      const amountBet = Number.parseFloat(match[1].replace(",", "."))
      const amountWon = match[2] ? Number.parseFloat(match[2].replace(",", ".")) : 0

      const platformMatch = lowerMessage.match(/(bet365|betano|sportingbet|pixbet|estrelabet|blaze|f12|galera\.?bet)/i)
      const platform = platformMatch ? platformMatch[1] : null

      const today = new Date().toISOString().split("T")[0]

      await sql`
        INSERT INTO gambling_bets (user_id, amount_bet, amount_won, platform, bet_date)
        VALUES (${userId}, ${amountBet}, ${amountWon}, ${platform}, ${today})
      `

      return {
        executed: true,
        action: "bet_added",
        details: { amountBet, amountWon, platform },
      }
    }
  }

  return { executed: false }
}

async function loadChatHistory(userId: string, limit = 20) {
  const messages = await sql`
    SELECT role, content, created_at
    FROM copilot_messages
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  return messages.reverse()
}

async function saveMessage(userId: string, role: "user" | "assistant", content: string, action?: string) {
  await sql`
    INSERT INTO copilot_messages (user_id, role, content, action)
    VALUES (${userId}, ${role}, ${content}, ${action})
  `
}

function buildActionFallbackResponse(actionResult: any) {
  if (!actionResult.executed) return null

  switch (actionResult.action) {
    case "expense_added":
      return `Pronto, registrei a despesa de ${formatCurrency(actionResult.details.amount)} com ${actionResult.details.description}.`
    case "income_added":
      return `Pronto, registrei a receita de ${formatCurrency(actionResult.details.amount)} de ${actionResult.details.description}.`
    case "bet_added": {
      const result = actionResult.details.amountWon
        ? ` e o retorno de ${formatCurrency(actionResult.details.amountWon)}`
        : ""
      return `Pronto, registrei a aposta de ${formatCurrency(actionResult.details.amountBet)}${result}.`
    }
    default:
      return "Pronto, registrei isso no seu controle financeiro."
  }
}

function buildContextSummary(userContext: string) {
  return userContext
    .split("\n")
    .filter((line) => {
      const normalized = line.toLowerCase()
      const plain = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      return (
        plain.includes("receitas:") ||
        plain.includes("despesas:") ||
        plain.includes("saldo") ||
        plain.includes("patrim") ||
        plain.includes("investimentos:") ||
        plain.includes("dividas:")
      )
    })
    .join("\n")
}

function buildFallbackResponse(message: string, actionResult: any, userContext: string) {
  const actionResponse = buildActionFallbackResponse(actionResult)
  if (actionResponse) return actionResponse

  const lowerMessage = message.toLowerCase()
  const summary = buildContextSummary(userContext)

  if (/^(oi|ol[aá]|ola|eae|bom dia|boa tarde|boa noite)\b/.test(lowerMessage)) {
    return "Ola! Sou o Alfred. Posso registrar gastos e receitas, consultar seu resumo financeiro e te dar dicas praticas."
  }

  if (/(saldo|gastei|gastos|despesas|receitas|patrim[oô]nio|investimentos|d[ií]vidas|dividas)/i.test(message)) {
    return summary
      ? `Aqui esta seu resumo financeiro atual:\n\n${summary}`
      : "Ainda nao encontrei dados financeiros cadastrados. Voce pode comecar dizendo algo como: gastei 50 de mercado."
  }

  if (/(dica|economizar|poupar|guardar dinheiro)/i.test(message)) {
    return "Uma dica pratica: separe primeiro um valor fixo para guardar e acompanhe seus maiores gastos da semana. Comece pequeno, mas mantenha constancia."
  }

  if (/(como funciona|app|nocontrole|plano|planos|ajuda)/i.test(message)) {
    return "O NoControle ajuda a registrar receitas, despesas, dividas, metas, investimentos e cartoes. Voce tambem pode me pedir para registrar algo por mensagem, como: gastei 50 de mercado."
  }

  return "Consigo te ajudar com registros e consultas financeiras. Tente algo como: gastei 50 de mercado, recebi 3000 de salario ou qual meu saldo atual?"
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

    const userInfo = await sql`SELECT gambling_enabled FROM users WHERE id = ${user.id}`
    const gamblingEnabled = userInfo[0]?.gambling_enabled || false

    await saveMessage(user.id, "user", message)

    const actionResult = await detectAndExecuteAction(message, user.id, gamblingEnabled)

    const userContext = await getUserFinancialContext(user.id)

    const history = await loadChatHistory(user.id, 8)

    const conversationHistory = history
      .slice(-6)
      .map((m: any) => `${m.role === "user" ? "Usuário" : "Alfred"}: ${m.content}`)
      .join("\n")

    const fullPrompt =
      SYSTEM_PROMPT.replace("{USER_CONTEXT}", userContext) +
      `

Conversa recente:
${conversationHistory}

${
  actionResult.executed
    ? `
AÇÃO EXECUTADA COM SUCESSO: ${actionResult.action}
Detalhes: ${JSON.stringify(actionResult.details)}
Confirme brevemente o que foi feito de forma amigável.
`
    : ""
}

Usuário: ${message}

Alfred:`

    let response: string
    let aiAvailable = true

    try {
      const { text } = await generateText({
        model: ALFRED_MODEL,
        prompt: fullPrompt,
        maxOutputTokens: 250,
      })

      response = text.trim()
      if (response.startsWith("Alfred:")) {
        response = response.replace("Alfred:", "").trim()
      }
    } catch (error) {
      aiAvailable = false
      console.error("Alfred model generation failed:", error)
      response = buildFallbackResponse(message, actionResult, userContext)
    }

    await saveMessage(user.id, "assistant", response, actionResult.action || undefined)

    return NextResponse.json({
      success: true,
      message: response,
      action: actionResult.executed ? actionResult.action : undefined,
      actionDetails: actionResult.details,
      aiAvailable,
    })
  } catch (error) {
    console.error("Error in copilot chat:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Desculpe, tive um problema técnico. Pode tentar novamente?",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const messages = await loadChatHistory(user.id, 50)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error loading chat history:", error)
    return NextResponse.json({ messages: [] })
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await sql`DELETE FROM copilot_messages WHERE user_id = ${user.id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing chat history:", error)
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 })
  }
}
