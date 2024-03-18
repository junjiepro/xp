"use client"

import { cn } from "@/lib/utils"
import { LinkWithLocale } from "next-export-i18n"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { pathname } = new URL(window.location.href)
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <LinkWithLocale
        href="/"
        className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === '/' ? "" : "text-muted-foreground")}
      >
        Overview
      </LinkWithLocale>
      <LinkWithLocale
        href="/organization"
        className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === '/organization' ? "" : "text-muted-foreground")}
      >
        Organizations
      </LinkWithLocale>
    </nav>
  )
}