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
  LanguageSwitcher
} from "next-export-i18n";

export function LangToggle() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <LanguageSwitcher lang="zh" className="w-full">中文</LanguageSwitcher>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <LanguageSwitcher lang="en" className="w-full">English</LanguageSwitcher>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
