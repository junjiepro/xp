"use client";
import { Auth } from "@supabase/auth-ui-react";
import { I18nVariables, ThemeSupa } from "@supabase/auth-ui-shared";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../types/database.types.types";
import { useTheme } from "next-themes";
import { useTranslation } from "next-export-i18n";

export default function AuthForm() {
  const supabase = createClientComponentClient<Database>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const localizationVariables: I18nVariables = {
    sign_up: {
      email_label: t("auth.supabase.sign_up.email_label"),
      password_label: t("auth.supabase.sign_up.password_label"),
      email_input_placeholder: t(
        "auth.supabase.sign_up.email_input_placeholder"
      ),
      password_input_placeholder: t(
        "auth.supabase.sign_up.password_input_placeholder"
      ),
      button_label: t("auth.supabase.sign_up.button_label"),
      loading_button_label: t("auth.supabase.sign_up.loading_button_label"),
      social_provider_text: t("auth.supabase.sign_up.social_provider_text"),
      link_text: t("auth.supabase.sign_up.link_text"),
      confirmation_text: t("auth.supabase.sign_up.confirmation_text"),
    },
    sign_in: {
      email_label: t("auth.supabase.sign_in.email_label"),
      password_label: t("auth.supabase.sign_in.password_label"),
      email_input_placeholder: t(
        "auth.supabase.sign_in.email_input_placeholder"
      ),
      password_input_placeholder: t(
        "auth.supabase.sign_in.password_input_placeholder"
      ),
      button_label: t("auth.supabase.sign_in.button_label"),
      loading_button_label: t("auth.supabase.sign_in.loading_button_label"),
      social_provider_text: t("auth.supabase.sign_in.social_provider_text"),
      link_text: t("auth.supabase.sign_in.link_text"),
    },
    forgotten_password: {
      email_label: t("auth.supabase.forgotten_password.email_label"),
      password_label: t("auth.supabase.forgotten_password.password_label"),
      email_input_placeholder: t(
        "auth.supabase.forgotten_password.email_input_placeholder"
      ),
      button_label: t("auth.supabase.forgotten_password.button_label"),
      loading_button_label: t(
        "auth.supabase.forgotten_password.loading_button_label"
      ),
      link_text: t("auth.supabase.forgotten_password.link_text"),
      confirmation_text: t(
        "auth.supabase.forgotten_password.confirmation_text"
      ),
    },
    update_password: {
      password_label: t("auth.supabase.update_password.password_label"),
      password_input_placeholder: t(
        "auth.supabase.update_password.password_input_placeholder"
      ),
      button_label: t("auth.supabase.update_password.button_label"),
      loading_button_label: t(
        "auth.supabase.update_password.loading_button_label"
      ),
      confirmation_text: t("auth.supabase.update_password.confirmation_text"),
    },
  };
  return (
    <Auth
      supabaseClient={supabase}
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: "black",
              brandAccent: "black",
            },
          },
        },
      }}
      localization={{
        variables: localizationVariables,
      }}
      theme={theme === "dark" ? "dark" : "default"}
      showLinks={true}
      providers={[]}
    />
  );
}
