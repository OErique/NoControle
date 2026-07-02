import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { CreditCardsModule } from "@/components/cards/credit-cards-module"

export default async function CardsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <CreditCardsModule userId={user.id} />
}
