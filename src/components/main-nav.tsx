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
        href="/"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Customers
      </LinkWithLocale>
      <LinkWithLocale
        href="/"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Products
      </LinkWithLocale>
      <LinkWithLocale
        href="/"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Settings
      </LinkWithLocale>
    </nav>
  )
}