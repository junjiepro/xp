"use client"

import AuthForm from "@/components/auth-form"
import { LinkWithLocale, useTranslation } from "next-export-i18n"

export default function Auth() {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('auth.signUp.create')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('auth.signUp.belowTip')}
        </p>
      </div>
      <AuthForm view="sign_up" />
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