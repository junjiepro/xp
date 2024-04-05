"use client";

import { useOrganizations, useRoles, useSetOrganizations } from "@/hooks/use-organizations";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner";
import { getCurrentUserOrganizations, getCurrentUserRoles, updateOrganizationName } from "@/lib/server";
import { useTranslation } from "next-export-i18n";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useSupabase } from "@/hooks/use-supabase";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";


export default function Profile() {
  const { t } = useTranslation();
  const supabase = useSupabase();
  const userProfile = useUserProfile();
  const setOrganizations = useSetOrganizations();
  const organizations = useOrganizations();
  const roles = useRoles();
  const searchParams = useSearchParams();

  const formSchema = z.object({
    name: z.string().min(2, {
      message: t("organization.formSchema.name.min"),
    }).max(50, {
      message: t("organization.formSchema.name.max"),
    })
  })
  const [processing, setProcessing] = React.useState(false);
  // 1. Define form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })
  const currentOrganization = React.useMemo(() => {
    const organizationId = searchParams.get("organizationId");
    if (organizations && organizationId) {
      const o = organizations.find((o) => o.id === organizationId);
      form.setValue("name", o?.name || "");
      return o;
    }
    form.setValue("name", "");
    return undefined;
  }, [organizations, searchParams])
  const currentRoles = React.useMemo(() => {
    const organizationId = searchParams.get("organizationId");
    if (roles && organizationId) {
      return roles.filter((r) => r.organization_id === organizationId);
    }
    return [];
  }, [roles, searchParams])
  const isOwner = currentRoles.some((r) => r.role_name === "Owner");

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    updateOrganization(values.name);
  }

  const updateOrganization = async (name: string) => {
    if (isOwner && name && currentOrganization && userProfile) {
      setProcessing(true);
      const { error: error1 } = await updateOrganizationName(supabase, currentOrganization.id, name);
      if (!error1) {
        toast.success(t('organization.update.success'));
        const { data: nextOrganizations, error: error2 } = await getCurrentUserOrganizations(supabase, userProfile.id);
        if (!error2) {
          setOrganizations(nextOrganizations);
        } else {
          toast.error(error2.message);
          console.log(error2);
        }
      } else {
        toast.error(error1.message);
        console.log(error1);
      }
      setProcessing(false);
    }
  }
  return (
    <div className="flex flex-col space-y-4 p-4">
      <Card className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{currentOrganization?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("organization.name")}</FormLabel>
                    <FormControl>
                      {isOwner ? <Input {...field} /> : <>{currentOrganization?.name}</>}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            {isOwner && <CardFooter>
              <Button type="submit" disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("action.save")}</Button>
            </CardFooter>}
          </form>
        </Form>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("organization.your_roles")}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentRoles.map((r) => (
            <Badge key={r.role_name} className="mr-2">{r.role_name}</Badge>
          ))}
        </CardContent>
        <CardFooter>
        </CardFooter>
      </Card>
      {isOwner && <Card className="w-full">
        <CardHeader>
          <CardTitle>{t("organization.danger_action")}</CardTitle>
          <CardDescription>{t("organization.danger_action_description")}</CardDescription>
        </CardHeader>
        <CardContent>
        </CardContent>
        <CardFooter className="space-x-2">
          <Button variant={"destructive"}>{t("organization.change_owner")}</Button>
          <Button variant={"destructive"}>{t("organization.delete")}</Button>
        </CardFooter>
      </Card>}
    </div>
  )
}