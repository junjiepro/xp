"use client"

import { cn } from "@/lib/utils"
import { LinkWithLocale } from "next-export-i18n"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <LinkWithLocale
        href="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Overview
      </LinkWithLocale>
      <LinkWithLocale
        href="/organization"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Organizations
      </LinkWithLocale>
    </nav>
  )
}