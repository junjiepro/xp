"use client"

import { useSearchParams } from "next/navigation";
import * as React from "react";
import CurrentOrganization from "./current-organization";
import Organizations from "./organizations";

export default function Organization({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams();
  const organizationId = React.useMemo(() => searchParams.get("organizationId"), [searchParams])
  return (
    <>{
      organizationId ? (
        <CurrentOrganization navCollapsedSize={4}>{children}</CurrentOrganization>
      ) : (
        <Organizations />
      )
    }</>
  )
}