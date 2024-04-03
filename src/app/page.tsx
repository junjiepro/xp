import { Metadata } from "next"

import DeviceOverview from "@/components/device-overview"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "XP - playgrounds, projects and more.",
}

export default function DashboardPage() {
  return (
    <DeviceOverview />
  )
}