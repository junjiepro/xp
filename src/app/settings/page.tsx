import { Metadata } from "next"

import { SettingsForm } from "@/components/settings-form"

export const metadata: Metadata = {
  title: "Settings",
  description: "XP - playgrounds, projects and more.",
}

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-center p-6">
        <div className="w-[500px] mx-auto">
          <SettingsForm />
        </div>
      </div>
    </>
  )
}