import { sql } from "./db"

interface CategoryMapping {
  pattern: string
  categoryId: string
  incomeCategoryId: string | null
  transactionType: "income" | "expense"
}

// Default category patterns for common transactions
const defaultPatterns: Array<{ pattern: RegExp; category: string; type: "income" | "expense" }> = [
  // Income patterns
  { pattern: /sal[aá]rio|pagamento|vencimento|remunera/i, category: "Salário", type: "income" },
  { pattern: /transfer[eê]ncia\s*(recebida|entrada|pix)/i, category: "Transferências", type: "income" },
  { pattern: /rendimento|juros|dividendo/i, category: "Investimentos", type: "income" },
  { pattern: /reembolso|estorno|devolu/i, category: "Outros", type: "income" },

  // Expense patterns
  {
    pattern: /supermercado|mercado|atacad[aã]o|carrefour|extra|p[aã]o de a[cç][uú]car/i,
    category: "Alimentação",
    type: "expense",
  },
  {
    pattern: /restaurante|lanchonete|ifood|uber\s*eats|rappi|burguer|pizza/i,
    category: "Alimentação",
    type: "expense",
  },
  {
    pattern: /uber|99|cabify|taxi|t[aá]xi|estacionamento|combustivel|gasolina|etanol|posto/i,
    category: "Transporte",
    type: "expense",
  },
  {
    pattern: /netflix|spotify|disney|amazon\s*prime|hbo|globoplay|deezer/i,
    category: "Entretenimento",
    type: "expense",
  },
  { pattern: /luz|energia|cpfl|enel|celpe|coelba|cemig|eletro/i, category: "Moradia", type: "expense" },
  { pattern: /[aá]gua|saneamento|sabesp|copasa|compesa/i, category: "Moradia", type: "expense" },
  { pattern: /aluguel|condom[ií]nio|iptu/i, category: "Moradia", type: "expense" },
  { pattern: /internet|fibra|vivo|claro|tim|oi\s|net\s/i, category: "Moradia", type: "expense" },
  {
    pattern: /farm[aá]cia|drogaria|medicamento|hospital|cl[ií]nica|m[eé]dico|consulta|exame|laborat/i,
    category: "Saúde",
    type: "expense",
  },
  { pattern: /escola|faculdade|universidade|curso|udemy|alura|mensalidade/i, category: "Educação", type: "expense" },
  {
    pattern: /roupa|cal[cç]ado|shopping|loja|magazine|renner|riachuelo|c&a|zara/i,
    category: "Compras",
    type: "expense",
  },
  { pattern: /transfer[eê]ncia|pix|ted|doc/i, category: "Transferências", type: "expense" },
  { pattern: /saque|atm|caixa\s*eletr[oô]nico/i, category: "Saques", type: "expense" },
]

async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `
    return result[0]?.exists === true
  } catch {
    return false
  }
}

export async function categorizeTransaction(
  userId: string,
  description: string,
  type: "income" | "expense",
): Promise<{ categoryId: string | null; categoryName: string }> {
  const hasMappingsTable = await tableExists("category_mappings")

  // First, check user's learned patterns (only if table exists)
  if (hasMappingsTable) {
    try {
      const userMappings = await sql`
        SELECT 
          cm.category_id,
          cm.income_category_id,
          ec.name as expense_category_name,
          ic.name as income_category_name
        FROM category_mappings cm
        LEFT JOIN expense_categories ec ON cm.category_id = ec.id
        LEFT JOIN income_categories ic ON cm.income_category_id = ic.id
        WHERE cm.user_id = ${userId}
        AND cm.transaction_type = ${type}
        AND LOWER(${description}) LIKE '%' || LOWER(cm.description_pattern) || '%'
        ORDER BY cm.usage_count DESC
        LIMIT 1
      `

      if (userMappings.length > 0) {
        const mapping = userMappings[0]
        if (type === "expense" && mapping.category_id) {
          return { categoryId: mapping.category_id, categoryName: mapping.expense_category_name }
        }
        if (type === "income" && mapping.income_category_id) {
          return { categoryId: mapping.income_category_id, categoryName: mapping.income_category_name }
        }
      }
    } catch (error) {
      // Continue with default patterns
      console.log("[NoControle] Error querying category_mappings, using default patterns")
    }
  }

  // Try default patterns
  for (const { pattern, category, type: patternType } of defaultPatterns) {
    if (patternType === type && pattern.test(description)) {
      // Find category in database
      if (type === "expense") {
        try {
          const categories = await sql`
            SELECT id, name FROM expense_categories 
            WHERE (is_default = true OR user_id = ${userId})
            AND LOWER(name) = LOWER(${category})
            LIMIT 1
          `
          if (categories.length > 0) {
            return { categoryId: categories[0].id, categoryName: categories[0].name }
          }
        } catch {
          // Continue to next pattern
        }
      } else {
        try {
          const categories = await sql`
            SELECT id, name FROM income_categories 
            WHERE (is_default = true OR user_id = ${userId})
            AND LOWER(name) = LOWER(${category})
            LIMIT 1
          `
          if (categories.length > 0) {
            return { categoryId: categories[0].id, categoryName: categories[0].name }
          }
        } catch {
          // Continue to next pattern
        }
      }
    }
  }

  // Return "Não categorizado" as fallback
  if (type === "expense") {
    try {
      const uncategorized = await sql`
        SELECT id, name FROM expense_categories 
        WHERE (is_default = true OR user_id = ${userId})
        AND LOWER(name) LIKE '%não categorizado%'
        LIMIT 1
      `
      if (uncategorized.length > 0) {
        return { categoryId: uncategorized[0].id, categoryName: uncategorized[0].name }
      }
    } catch {
      // Return default
    }
  } else {
    try {
      const uncategorized = await sql`
        SELECT id, name FROM income_categories 
        WHERE (is_default = true OR user_id = ${userId})
        AND LOWER(name) LIKE '%outr%'
        LIMIT 1
      `
      if (uncategorized.length > 0) {
        return { categoryId: uncategorized[0].id, categoryName: uncategorized[0].name }
      }
    } catch {
      // Return default
    }
  }

  return { categoryId: null, categoryName: "Não categorizado" }
}

export async function learnCategoryMapping(
  userId: string,
  description: string,
  categoryId: string,
  type: "income" | "expense",
): Promise<void> {
  const hasMappingsTable = await tableExists("category_mappings")
  if (!hasMappingsTable) {
    return // Skip learning if table doesn't exist
  }

  try {
    const pattern = extractPattern(description)

    if (type === "expense") {
      await sql`
        INSERT INTO category_mappings (user_id, description_pattern, category_id, transaction_type, usage_count)
        VALUES (${userId}, ${pattern}, ${categoryId}, ${type}, 1)
        ON CONFLICT (user_id, description_pattern, transaction_type)
        DO UPDATE SET 
          category_id = ${categoryId},
          usage_count = category_mappings.usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      `
    } else {
      await sql`
        INSERT INTO category_mappings (user_id, description_pattern, income_category_id, transaction_type, usage_count)
        VALUES (${userId}, ${pattern}, ${categoryId}, ${type}, 1)
        ON CONFLICT (user_id, description_pattern, transaction_type)
        DO UPDATE SET 
          income_category_id = ${categoryId},
          usage_count = category_mappings.usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      `
    }
  } catch (error) {
    // Skip learning on error
    console.log("[NoControle] Error learning category mapping:", error)
  }
}

function extractPattern(description: string): string {
  // Remove numbers, special chars, and normalize
  return description
    .replace(/\d+/g, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ")
    .toLowerCase()
}
