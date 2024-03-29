"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useTranslation } from "next-export-i18n"
import React from "react"
import { ModeToggle } from "./mode-toggle"
import { LangToggle } from "./lang-toggle"
import { Label } from "./ui/label"
import { useTheme } from "next-themes"

export function SettingsForm() {
  const { t } = useTranslation();
  const { theme } = useTheme()

  const formSchema = z.object({})
  // 1. Define form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {

  }

  return (
    <Form {...form}>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 pb-8">
        <h2 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h2>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormItem>
          <FormLabel>{t('settings.formSchema.lang.label')}</FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2">
              <Label>{t('lang.name')}</Label><LangToggle />
            </div>
          </FormControl>
          <FormDescription>
            {t('settings.formSchema.lang.description')}
          </FormDescription>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>{t('settings.formSchema.theme.label')}</FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2">
              <Label>{t(`settings.formSchema.theme.${theme}`)}</Label><ModeToggle />
            </div>
          </FormControl>
          <FormDescription>
            {t('settings.formSchema.theme.description')}
          </FormDescription>
          <FormMessage />
        </FormItem>
      </form>
    </Form>
  )
}
