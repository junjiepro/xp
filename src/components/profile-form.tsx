"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTranslation } from "next-export-i18n"
import React from "react"
import { useSetUserProfile, useUserProfile } from "@/hooks/use-user-profile"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useSupabase } from "@/hooks/use-supabase"
import { updateUserProfile } from "@/lib/server"

export function ProfileForm() {
  const { t } = useTranslation();
  const supbase = useSupabase();
  const userProfile = useUserProfile();
  const setUserProfile = useSetUserProfile();

  const formSchema = z.object({
    username: z.string().min(2, {
      message: t('profile.formSchema.username.min'),
    }).max(50, {
      message: t('profile.formSchema.username.max'),
    })
  })
  const [processing, setProcessing] = React.useState(false);
  // 1. Define form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: userProfile?.username,
    },
  })
  React.useEffect(() => {
    form.setValue('username', userProfile?.username || '');
  }, [userProfile?.username]);

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProfile(values.username)
  }

  const updateProfile = async (username: string) => {
    if (username && userProfile) {
      setProcessing(true);
      const { data, error } = await updateUserProfile(supbase, userProfile.id, username);
      if (!error) {
        setUserProfile(data);
        toast.success(t('profile.update.success'));
      } else {
        toast.error(error.message);
        console.log(error);
      }
      setProcessing(false);
    }
  }

  return (
    <Form {...form}>
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 pb-8">
        <h2 className="text-3xl font-bold tracking-tight">{t('common.profile')}</h2>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.formSchema.username.label')}</FormLabel>
              <FormControl>
                <Input placeholder="xp" {...field} />
              </FormControl>
              <FormDescription>
                {t('profile.formSchema.username.description')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={processing}>{processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t('action.submit')}</Button>
      </form>
    </Form>
  )
}
