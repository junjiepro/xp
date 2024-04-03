"use client"

import * as React from "react";
import { useOrganizations, useRoles } from "@/hooks/use-organizations";
import { useTranslation } from "next-export-i18n";
import { useSearchParams } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CurrentOrganization() {
  const { t } = useTranslation();
  const roles = useRoles();
  const organizations = useOrganizations();
  const searchParams = useSearchParams();
  const currentOrganization = React.useMemo(() => {
    const organizationId = searchParams.get("organizationId");
    if (organizations && organizationId) {
      return organizations.find((o) => o.id === organizationId);
    }
    return undefined;
  }, [organizations, searchParams])
  const currentRoles = React.useMemo(() => {
    const organizationId = searchParams.get("organizationId");
    if (roles && organizationId) {
      return roles.filter((r) => r.organization_id === organizationId);
    }
    return [];
  }, [roles, searchParams])
  return (
    <>{
      currentOrganization ? (
        <ResizablePanelGroup
          direction="horizontal"
          className="w-screen rounded-lg border"
        >
          <ResizablePanel defaultSize={25} minSize={10}>
            <div className="h-[calc((100vh-68px))] flex flex-col">
              <ScrollArea className="flex-auto w-full p-4">
                <span className="font-semibold">Applications</span>
              </ScrollArea>
              <ScrollArea className="h-64 w-full border-t p-4">
                <span className="font-semibold">Settings</span>
              </ScrollArea>

            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75} minSize={10}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Content</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : null
    }</>
  )
}