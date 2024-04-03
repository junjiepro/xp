"use client"

import * as React from "react";
import { useRoles } from "@/hooks/use-organizations";
import { useTranslation } from "next-export-i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "@/types/database.types";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";

export default function Organizations() {
  const { t } = useTranslation();
  const router = useRouter();
  const roles = useRoles();
  const organizations = React.useMemo(() => {
    const m: Record<string, {
      organization: Database["public"]["Views"]["user_role_with_organizations"]["Row"],
      roles: Database["public"]["Views"]["user_role_with_organizations"]["Row"][]
    }> = {}
    roles.forEach((r) => {
      if (r.organization_id) {
        if (!m[r.organization_id]) {
          m[r.organization_id] = {
            organization: r,
            roles: [],
          }
        }
        m[r.organization_id].roles.push(r)
      }
    })
    return Object.values(m)
  }, [roles])
  return (<div className="flex-1 space-y-4 p-8 pt-6">
    <div className="flex flex-col md:flex-row items-center justify-between space-y-2">
      <h2 className="text-3xl font-bold tracking-tight">{t("organization.organizations")}</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {organizations.map((o) => (
        <Card key={o.organization.organization_id} className="hover:cursor-pointer" onClick={() => {
          router.push(`/organization?organizationId=${o.organization.organization_id}`)
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium space-x-1">
              {o.roles.slice(0, 3).map((r) => <Badge key={r.role_id} variant={"outline"}>{r.role_name}</Badge>)}
              {o.roles.length > 3 && <Badge variant={"secondary"}>+{o.roles.length - 3}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold py-2">{o.organization.organization_name}</div>
            <p className="text-xs text-muted-foreground text-right">

            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>)
}