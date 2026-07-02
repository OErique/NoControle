import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { GamblingModule } from "@/components/gambling/gambling-module"

export default async function GamblingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <GamblingModule userId={user.id} gamblingEnabled={user.gambling_enabled || false} />
}
