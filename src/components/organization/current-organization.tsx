"use client"

import { useOrganizations } from "@/hooks/use-organizations";
import { useTranslation } from "next-export-i18n";
import { useSearchParams } from "next/navigation";
import * as React from "react";


export default function CurrentOrganization() {
  const { t } = useTranslation();
  const organizations = useOrganizations();
  const searchParams = useSearchParams();
  const selectedOrganization = React.useMemo(() => {
    const organizationId = searchParams.get("organizationId");
    if (organizations && organizationId) {
      return organizations.find((o) => o.id === organizationId);
    }
    return undefined;
  }, [organizations, searchParams])
  return (
    <>{
      selectedOrganization ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">{selectedOrganization.name}</h1>
          </div>
        </div>
      ) : null
    }</>
  )
}