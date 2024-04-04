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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Settings, Calculator,
  Calendar,
  CreditCard,
  Smile,
  User,
} from "lucide-react";

export default function CurrentOrganization({
  children,
}: {
  children: React.ReactNode
}) {
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
          <ResizablePanel defaultSize={20} minSize={10}>
            <div className="h-[calc((100vh-68px))] flex flex-col">
              <ScrollArea className="flex-auto w-full p-0">
                <Command>
                  <CommandInput placeholder="Type a command or search..." />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    <CommandGroup heading="Suggestions">
                      <CommandItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Calendar</span>
                      </CommandItem>
                      <CommandItem>
                        <Smile className="mr-2 h-4 w-4" />
                        <span>Search Emoji</span>
                      </CommandItem>
                      <CommandItem>
                        <Calculator className="mr-2 h-4 w-4" />
                        <span>Calculator</span>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </ScrollArea>
              <ScrollArea className="h-64 w-full border-t p-0">
                <Command>
                  <CommandList>
                    <CommandGroup heading="Settings">
                      <CommandItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                        <CommandShortcut>⌘P</CommandShortcut>
                      </CommandItem>
                      <CommandItem>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Billing</span>
                        <CommandShortcut>⌘B</CommandShortcut>
                      </CommandItem>
                      <CommandItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </ScrollArea>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80} minSize={10}>
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : null
    }</>
  )
}