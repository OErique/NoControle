import { NextResponse } from "next/server"
import { generateText } from "ai"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { question, context } = await req.json()

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    const systemPrompt = `Você é um consultor financeiro pessoal amigável e empático. Seu objetivo é ajudar o usuário a tomar melhores decisões financeiras.

Contexto financeiro atual do usuário:
- Receita mensal: ${formatCurrency(context.income || 0)}
- Gastos do mês: ${formatCurrency(context.expenses || 0)}
- Total em dívidas: ${formatCurrency(context.debts || 0)}
- Total investido: ${formatCurrency(context.investments || 0)}
- Saldo disponível: ${formatCurrency((context.income || 0) - (context.expenses || 0))}

Regras:
1. Seja conciso e direto (máximo 3-4 parágrafos)
2. Use linguagem simples e acessível em português brasileiro
3. Seja empático e encorajador, nunca julgue
4. Dê sugestões práticas e acionáveis
5. Use números e porcentagens quando relevante
6. Se não souber algo específico, seja honesto
7. Foque em educação financeira básica`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      system: systemPrompt,
      prompt: question,
      maxOutputTokens: 500,
    })

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in AI copilot:", error)
    return NextResponse.json({ error: "Erro ao processar sua pergunta. Tente novamente." }, { status: 500 })
  }
}
