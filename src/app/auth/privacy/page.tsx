"use client"

import AuthForm from "@/components/auth-form"
import { LinkWithLocale, useTranslation } from "next-export-i18n"

export default function Auth() {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('auth.privacy')}
        </h1>
      </div>
    </>

  )
}