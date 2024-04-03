import { Metadata } from "next"

import Organization from "@/components/organization"

export const metadata: Metadata = {
  title: "Organization",
  description: "XP - playgrounds, projects and more.",
}

export default function DashboardPage() {
  return (
    <>
      <Organization />
    </>
  )
}