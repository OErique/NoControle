"use client"

import { useRouter } from "next/navigation"
import { LogOut, User, ChevronDown, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { NotificationsDropdown } from "./notifications-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  user: {
    name?: string | null
    email: string
    plan_name?: string
    avatar_url?: string | null
  }
}

export function DashboardHeader({ user }: HeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      toast.success("Logout realizado com sucesso")
      router.push("/login")
    } catch {
      toast.error("Erro ao fazer logout")
    }
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-lg px-4 lg:px-8">
      <div className="lg:hidden" />
      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name || "Usuario"} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium">{user.name || "Usuario"}</p>
                <p className="text-xs text-muted-foreground">{user.plan_name || "Essencial"}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracoes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
