"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Notification {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  async function fetchNotifications() {
    try {
      setLoading(true)
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNotifications(data)
    } catch {
      toast.error("Erro ao carregar notificações")
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: number) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" })
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch {
      toast.error("Erro ao marcar como lida")
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success("Todas as notificações foram marcadas como lidas")
    } catch {
      toast.error("Erro ao marcar todas como lidas")
    }
  }

  async function deleteNotification(id: number) {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success("Notificação removida")
    } catch {
      toast.error("Erro ao remover notificação")
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "debt_due":
        return "💳"
      case "goal_achieved":
        return "🎯"
      case "challenge_completed":
        return "🏆"
      case "streak":
        return "🔥"
      case "warning":
        return "⚠️"
      default:
        return "📌"
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "group relative border-b border-border p-4 transition-colors hover:bg-muted/50",
                  !notification.read && "bg-primary/5",
                )}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteNotification(notification.id)
                  }}
                  className="absolute right-2 top-2 hidden rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground group-hover:block"
                >
                  <X className="h-3 w-3" />
                </button>

                <div
                  className="cursor-pointer"
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id)
                    }
                    if (notification.action_url) {
                      window.location.href = notification.action_url
                    }
                  }}
                >
                  <div className="mb-1 flex items-start gap-2">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">{notification.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!notification.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
