"use client"

import Image from "next/image"
import AuthForm from "@/components/auth-form"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LinkWithLocale, useTranslation } from "next-export-i18n"
import { LangToggle } from "@/components/lang-toggle"
import { ModeToggle } from "@/components/mode-toggle"
import { Children } from "react"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { t } = useTranslation();
  return (
    <>
      <div className="container relative h-[100vh] flex flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className={cn(
          "absolute right-4 top-4 md:right-8 md:top-8 flex gap-2"
        )}>
          <LangToggle />
          <ModeToggle />
        </div>
        <div className={cn(
          "absolute right-4 bottom-4 md:right-8 md:bottom-8 flex gap-2"
        )}>
          <LinkWithLocale
            href="/auth/sign-in"
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("auth.signIn.title")}
          </LinkWithLocale>
          <LinkWithLocale
            href="/auth/sign-up"
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("auth.signUp.title")}
          </LinkWithLocale>
          <LinkWithLocale
            href="/auth/forgotten-password"
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("auth.forgottenPassword.title")}
          </LinkWithLocale>
        </div>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            Acme Inc
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This library has saved me countless hours of work and
                helped me deliver stunning designs to my clients faster than
                ever before.&rdquo;
              </p>
              <footer className="text-sm">Sofia Davis</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {children}
          </div>
        </div>
      </div>
    </>

  )
}