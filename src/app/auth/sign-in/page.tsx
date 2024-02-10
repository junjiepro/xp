"use client"

import AuthForm from "@/components/auth-form"
import { LinkWithLocale, useTranslation } from "next-export-i18n"

export default function Auth() {
  const { t } = useTranslation();
  return (
    <>
      <AuthForm />
      <p className="px-8 text-center text-sm text-muted-foreground">
        {t('auth.agree')}
        <LinkWithLocale
          href="/auth/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t('auth.terms')}
        </LinkWithLocale>
        {t('auth.and')}
        <LinkWithLocale
          href="/auth/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t('auth.privacy')}
        </LinkWithLocale>
      </p>
    </>

  )
}