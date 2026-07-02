"use client"

import type React from "react"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "oklch(0.18 0 0)",
          "--normal-text": "oklch(0.985 0 0)",
          "--normal-border": "oklch(0.28 0 0)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
