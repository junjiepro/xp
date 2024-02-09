"use client"

import AuthForm from "@/components/auth-form"
import { LinkWithLocale, useTranslation } from "next-export-i18n"

export default function Auth() {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('auth.signIn.title')}
        </h1>
      </div>
      <AuthForm view="sign_in" />
      <p className="px-8 text-center text-sm text-muted-foreground">
        {t('auth.agree')}
        <LinkWithLocale
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t('auth.terms')}
        </LinkWithLocale>
        {t('auth.and')}
        <LinkWithLocale
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t('auth.privacy')}
        </LinkWithLocale>
      </p>
    </>

  )
}