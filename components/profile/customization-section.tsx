"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Palette, Crown, Award, Zap, User, Check, ChevronRight } from "lucide-react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ActiveItems {
  active_border_id: string | null
  active_theme_id: string | null
  active_badge_id: string | null
  active_animation_id: string | null
  profile_title: string | null
}

interface CustomizationItem {
  item_id: string
  name: string
  item_type: string
  image_url: string | null
  is_active: boolean
}

interface CustomizationSectionProps {
  userId: string
  avatarUrl: string | null
  userName: string | null
}

export function CustomizationSection({ userId, avatarUrl, userName }: CustomizationSectionProps) {
  const [activeItems, setActiveItems] = useState<ActiveItems | null>(null)
  const [inventory, setInventory] = useState<Record<string, CustomizationItem[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory")
      if (res.ok) {
        const data = await res.json()
        setActiveItems(data.activeItems)
        setInventory(data.inventory)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickActivate = async (itemId: string, itemType: string) => {
    try {
      const res = await fetch("/api/inventory/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, activate: true }),
      })

      if (res.ok) {
        const result = await res.json()
        toast.success(result.message)
        await fetchInventory()
      }
    } catch (error) {
      toast.error("Erro ao ativar item")
    }
  }

  const handleDeactivate = async (itemType: string) => {
    const activeId =
      itemType === "border"
        ? activeItems?.active_border_id
        : itemType === "theme"
          ? activeItems?.active_theme_id
          : itemType === "badge"
            ? activeItems?.active_badge_id
            : activeItems?.active_animation_id

    if (!activeId) return

    try {
      const res = await fetch("/api/inventory/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: activeId, activate: false }),
      })

      if (res.ok) {
        toast.success("Item desativado")
        await fetchInventory()
      }
    } catch (error) {
      toast.error("Erro ao desativar item")
    }
  }

  if (isLoading) {
    return (
      <AnimatedCard>
        <div className="p-6 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AnimatedCard>
    )
  }

  const categories = [
    {
      key: "border",
      label: "Borda do Avatar",
      icon: Crown,
      activeId: activeItems?.active_border_id,
      items: inventory.border || [],
    },
    {
      key: "theme",
      label: "Tema do Perfil",
      icon: Palette,
      activeId: activeItems?.active_theme_id,
      items: inventory.theme || [],
    },
    {
      key: "badge",
      label: "Badge Visivel",
      icon: Award,
      activeId: activeItems?.active_badge_id,
      items: inventory.badge || [],
    },
    {
      key: "animation",
      label: "Animacao",
      icon: Zap,
      activeId: activeItems?.active_animation_id,
      items: inventory.animation || [],
    },
  ]

  const getActiveItem = (items: CustomizationItem[], activeId: string | null) => {
    return items.find((item) => item.item_id === activeId)
  }

  // Get the active border for preview
  const activeBorder = getActiveItem(inventory.border || [], activeItems?.active_border_id || null)

  return (
    <AnimatedCard>
      <div className="p-4 sm:p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Personalizacao do Perfil
        </h3>

        {/* Live Preview */}
        <div className="mb-6 p-4 rounded-xl bg-muted/50 flex items-center gap-4">
          <div
            className={cn("relative h-16 w-16 rounded-full p-1", activeBorder ? "animate-border-glow" : "")}
            style={{
              background: activeBorder?.image_url || "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
              backgroundSize: "200% 200%",
            }}
          >
            <div className="h-full w-full rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl || "/placeholder.svg"}
                  alt={userName || ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          </div>
          <div>
            <p className="font-medium">{userName || "Seu Perfil"}</p>
            <p className="text-sm text-muted-foreground">Preview em tempo real</p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {categories.map((category) => {
            const Icon = category.icon
            const activeItem = getActiveItem(category.items, category.activeId || null)
            const isExpanded = expandedCategory === category.key

            return (
              <div key={category.key} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        activeItem ? "bg-primary/20" : "bg-muted",
                      )}
                    >
                      <Icon className={cn("h-4 w-4", activeItem ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{category.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {activeItem ? activeItem.name : "Nenhum selecionado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeItem && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Ativo</span>
                    )}
                    <ChevronRight
                      className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")}
                    />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t"
                  >
                    <div className="p-3">
                      {category.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Voce nao possui itens desta categoria.
                          <br />
                          <a href="/profile" className="text-primary hover:underline">
                            Visite a loja
                          </a>
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {/* None option */}
                          <button
                            onClick={() => handleDeactivate(category.key)}
                            className={cn(
                              "p-3 rounded-lg border text-center transition-all",
                              !category.activeId
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            <div className="h-8 w-8 mx-auto mb-1 rounded-full bg-muted flex items-center justify-center">
                              {!category.activeId && <Check className="h-4 w-4 text-primary" />}
                            </div>
                            <span className="text-xs">Nenhum</span>
                          </button>

                          {/* Items */}
                          {category.items.map((item) => (
                            <button
                              key={item.item_id}
                              onClick={() => handleQuickActivate(item.item_id, category.key)}
                              className={cn(
                                "p-3 rounded-lg border text-center transition-all",
                                item.is_active
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50",
                              )}
                            >
                              <div className="h-8 w-8 mx-auto mb-1 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                {item.is_active ? (
                                  <Check className="h-4 w-4 text-white" />
                                ) : (
                                  <Icon className="h-4 w-4 text-white" />
                                )}
                              </div>
                              <span className="text-xs line-clamp-1">{item.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AnimatedCard>
  )
}
