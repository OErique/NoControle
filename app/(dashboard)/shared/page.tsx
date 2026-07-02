import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/session"
import { SharedProfileModule } from "@/components/shared/shared-profile-module"

export default async function SharedPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return <SharedProfileModule userId={user.id} userName={user.name || ""} userEmail={user.email} />
}
