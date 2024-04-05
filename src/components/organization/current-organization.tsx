"use client"

import * as React from "react";
import { useOrganizationLayout, useOrganizations, useRoles, useSetOrganizationLayout } from "@/hooks/use-organizations";
import { useTranslation } from "next-export-i18n";
import { useSearchParams } from "next/navigation";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Settings,
  Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Nav } from "@/components/nav";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function CurrentOrganization({
  navCollapsedSize,
  children,
}: {
  navCollapsedSize: number
  children: React.ReactNode
}) {
  const { t } = useTranslation();
  const roles = useRoles();
  const organizations = useOrganizations();
  const searchParams = useSearchParams();
  const organizationLayout = useOrganizationLayout();
  const setOrganizationLayout = useSetOrganizationLayout();

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
  const isAdmin = currentRoles.some((r) => r.role_name === "Administrator");

  return (
    <>{
      currentOrganization ? (
        <TooltipProvider delayDuration={0}>
          <ResizablePanelGroup
            direction="horizontal"
            onLayout={(sizes: number[]) => {
              setOrganizationLayout({
                ...organizationLayout,
                layout: sizes,
              })
            }}
            className="h-full max-h-[100vh] items-stretch"
          >
            <ResizablePanel
              defaultSize={organizationLayout.layout[0]}
              collapsedSize={navCollapsedSize}
              collapsible={true}
              minSize={15}
              maxSize={20}
              onCollapse={() => {
                setOrganizationLayout({
                  ...organizationLayout,
                  collapsed: true,
                })
              }}
              onExpand={() => {
                setOrganizationLayout({
                  ...organizationLayout,
                  collapsed: false,
                })
              }}
              className={cn(organizationLayout.collapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
            >
              <div className="h-[calc((100vh-68px))] flex flex-col">
                <ScrollArea className="flex-auto w-full p-0">
                  <Nav
                    isCollapsed={organizationLayout.collapsed}
                    links={[]}
                  />
                </ScrollArea>
                <ScrollArea className="h-64 w-full border-t p-0">
                  <Nav
                    isCollapsed={organizationLayout.collapsed}
                    links={isAdmin ? [
                      {
                        title: t('common.profile'),
                        label: "",
                        icon: Gem,
                        variant: "ghost",
                        path: `/organization/profile`,
                        param: `organizationId=${searchParams.get("organizationId")}`,
                      },
                      {
                        title: t('common.settings'),
                        label: "",
                        icon: Settings,
                        variant: "ghost",
                        path: `/organization/settings`,
                        param: `organizationId=${searchParams.get("organizationId")}`,
                      },
                    ] : [{
                      title: t('common.profile'),
                      label: "",
                      icon: Gem,
                      variant: "ghost",
                      path: `/organization/profile`,
                      param: `organizationId=${searchParams.get("organizationId")}`,
                    }]}
                  />
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={organizationLayout.layout[1]} minSize={30}>
              {children}
            </ResizablePanel>
          </ResizablePanelGroup>
        </TooltipProvider>) : null
    }</>
  )
}