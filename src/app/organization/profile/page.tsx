import Profile from "@/components/organization/profile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Metadata } from "next"
import * as React from "react";

export const metadata: Metadata = {
  title: "Organization Profile",
  description: "XP - playgrounds, projects and more.",
}

export default function DashboardPage() {
  return (
    <ScrollArea className="h-[calc((100vh-68px))] w-full border-t p-0">
      <Profile />
    </ScrollArea>
  )
}