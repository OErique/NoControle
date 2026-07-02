export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  originalLine?: string
}

export const EXPENSE_KEYWORDS = [
  // Explicit debit indicators
  "débito",
  "debito",
  "deb",
  "saída",
  "saida",
  "pagamento",
  "pag",
  "transferência enviada",
  "transferencia enviada",
  "ted enviada",
  "pix enviado",
  "compra",
  "saque",
  "tarifa",
  "taxa",
  "anuidade",
  "mensalidade",
  "iof",
  "juros",
  "multa",
  "encargo",
  "estorno",
  "cobrança",
  // Common expense merchants/types
  "uber",
  "99",
  "ifood",
  "rappi",
  "netflix",
  "spotify",
  "amazon",
  "mercado",
  "supermercado",
  "farmácia",
  "farmacia",
  "posto",
  "combustível",
  "restaurante",
  "lanchonete",
  "padaria",
  "delivery",
]

export const INCOME_KEYWORDS = [
  // Explicit credit indicators
  "crédito",
  "credito",
  "cred",
  "entrada",
  "recebido",
  "recebimento",
  "transferência recebida",
  "transferencia recebida",
  "ted recebida",
  "pix recebido",
  "depósito",
  "deposito",
  "salário",
  "salario",
  "rendimento",
  "dividendo",
  "reembolso",
  "restituição",
  "restituicao",
  "cashback",
  "bonificação",
  "aluguel recebido",
  "venda",
  "honorário",
  "honorario",
  "freelance",
]

export function determineTransactionType(
  description: string,
  rawAmount: number,
  indicators?: { debitIndicator?: string; creditIndicator?: string },
): "income" | "expense" {
  const descLower = description.toLowerCase()

  // 1. Check explicit amount sign (most reliable)
  if (rawAmount < 0) return "expense"
  if (rawAmount > 0 && indicators?.creditIndicator) return "income"

  // 2. Check for D/C indicators in description
  if (indicators?.debitIndicator === "D" || descLower.endsWith(" d")) return "expense"
  if (indicators?.creditIndicator === "C" || descLower.endsWith(" c")) return "income"

  // 3. Check for keywords (more thorough)
  for (const keyword of EXPENSE_KEYWORDS) {
    if (descLower.includes(keyword)) return "expense"
  }

  for (const keyword of INCOME_KEYWORDS) {
    if (descLower.includes(keyword)) return "income"
  }

  // 4. Default to expense (more common transaction type)
  return "expense"
}
