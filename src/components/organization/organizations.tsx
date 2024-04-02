"use client"

import * as React from "react";
import { useOrganizations } from "@/hooks/use-organizations";
import { useTranslation } from "next-export-i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Organizations() {
  const { t } = useTranslation();
  const organizations = useOrganizations();
  return (<div className="flex-1 space-y-4 p-8 pt-6">
    <div className="flex flex-col md:flex-row items-center justify-between space-y-2">
      <h2 className="text-3xl font-bold tracking-tight">{t("organization.organizations")}</h2>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {organizations.map((o) => (
        <Card key={o.id} className="hover:cursor-pointer" onClick={() => {

        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">

            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold py-2">{o.name || o.id}</div>
            <p className="text-xs text-muted-foreground text-right">

            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>)
}