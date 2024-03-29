"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LanguageSwitcher, useTranslation
} from "next-export-i18n";

export function LangToggle() {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          <span className="sr-only">{t('lang.tip')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <LanguageSwitcher lang="zh" className="w-full"><DropdownMenuItem>中文</DropdownMenuItem></LanguageSwitcher>
        <LanguageSwitcher lang="en" className="w-full"><DropdownMenuItem>English</DropdownMenuItem></LanguageSwitcher>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
