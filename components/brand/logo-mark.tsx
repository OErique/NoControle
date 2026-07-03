import Image from "next/image"
import { cn } from "@/lib/utils"

const logoSizes = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-9 w-9 rounded-xl",
  lg: "h-10 w-10 rounded-xl",
}

type LogoMarkProps = {
  size?: keyof typeof logoSizes
  className?: string
}

export function LogoMark({ size = "md", className }: LogoMarkProps) {
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden bg-black shadow-lg shadow-primary/20", logoSizes[size], className)}>
      <Image src="/logo.webp" alt="NoControle" fill sizes="40px" className="object-cover" priority={size === "lg"} />
    </span>
  )
}
