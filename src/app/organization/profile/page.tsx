import Profile from "@/components/organization/profile";
import { Metadata } from "next"
import * as React from "react";

export const metadata: Metadata = {
  title: "Organization",
  description: "XP - playgrounds, projects and more.",
}

export default function DashboardPage() {
  return (
    <Profile />
  )
}