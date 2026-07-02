import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// Simplified crypto price fetcher using CoinGecko free API
async function getCryptoPrices(): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,cardano,dogecoin,polkadot,avalanche-2,chainlink,litecoin&vs_currencies=brl",
      { next: { revalidate: 300 } }, // Cache for 5 minutes
    )
    if (!res.ok) return {}
    const data = await res.json()

    // Map common names to prices
    return {
      bitcoin: data.bitcoin?.brl || 0,
      btc: data.bitcoin?.brl || 0,
      ethereum: data.ethereum?.brl || 0,
      eth: data.ethereum?.brl || 0,
      bnb: data.binancecoin?.brl || 0,
      solana: data.solana?.brl || 0,
      sol: data.solana?.brl || 0,
      cardano: data.cardano?.brl || 0,
      ada: data.cardano?.brl || 0,
      dogecoin: data.dogecoin?.brl || 0,
      doge: data.dogecoin?.brl || 0,
      polkadot: data.polkadot?.brl || 0,
      dot: data.polkadot?.brl || 0,
      avalanche: data["avalanche-2"]?.brl || 0,
      avax: data["avalanche-2"]?.brl || 0,
      chainlink: data.chainlink?.brl || 0,
      link: data.chainlink?.brl || 0,
      litecoin: data.litecoin?.brl || 0,
      ltc: data.litecoin?.brl || 0,
    }
  } catch (error) {
    console.error("Error fetching crypto prices:", error)
    return {}
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's crypto investments
    const cryptoInvestments = await sql`
      SELECT i.id, i.name, i.initial_amount, i.current_amount, it.name as type_name
      FROM investments i
      JOIN investment_types it ON i.type_id = it.id
      WHERE i.user_id = ${user.id}
      AND LOWER(it.name) LIKE '%cripto%'
    `

    if (cryptoInvestments.length === 0) {
      return NextResponse.json({ updated: 0, message: "Nenhum investimento em criptomoedas encontrado" })
    }

    const prices = await getCryptoPrices()
    let updatedCount = 0

    for (const inv of cryptoInvestments) {
      // Try to match investment name with crypto
      const nameLower = inv.name.toLowerCase()
      let matchedPrice = 0

      for (const [crypto, price] of Object.entries(prices)) {
        if (nameLower.includes(crypto)) {
          matchedPrice = price
          break
        }
      }

      if (matchedPrice > 0) {
        // Calculate quantity based on initial investment (simplified)
        // In real app, user would input quantity
        const estimatedQuantity = Number(inv.initial_amount) / matchedPrice
        const newValue = estimatedQuantity * matchedPrice

        await sql`
          UPDATE investments 
          SET current_amount = ${newValue}, updated_at = NOW()
          WHERE id = ${inv.id}
        `
        updatedCount++
      }
    }

    return NextResponse.json({
      updated: updatedCount,
      message: `${updatedCount} investimentos atualizados com sucesso`,
    })
  } catch (error) {
    console.error("Error refreshing prices:", error)
    return NextResponse.json({ error: "Erro ao atualizar precos" }, { status: 500 })
  }
}
