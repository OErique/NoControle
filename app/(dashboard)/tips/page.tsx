import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { TipsModule } from "@/components/tips/tips-module"

export default async function TipsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <TipsModule
      userId={user.id}
      userName={user.name || "Usuário"}
      userAvatar={user.avatar_url || undefined}
      userPoints={user.total_points || 0}
    />
  )
}
