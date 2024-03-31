"use client"

import { cn } from "@/lib/utils"
import { LinkWithLocale, useTranslation } from "next-export-i18n"
import { usePathname } from "next/navigation"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const { t } = useTranslation()
  const pathname = usePathname()
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <LinkWithLocale
        href="/"
        className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === '/' ? "" : "text-muted-foreground")}
      >
        {t("common.overview")}
      </LinkWithLocale>
      <LinkWithLocale
        href="/organization"
        className={cn("text-sm font-medium transition-colors hover:text-primary", pathname === '/organization' ? "" : "text-muted-foreground")}
      >
        {t("common.organizations")}
      </LinkWithLocale>
    </nav>
  )
}