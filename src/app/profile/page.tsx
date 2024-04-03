import { Metadata } from "next"

import { ProfileForm } from "@/components/profile-form"

export const metadata: Metadata = {
  title: "Profile",
  description: "XP - playgrounds, projects and more.",
}

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-center p-6">
        <div className="w-[500px] mx-auto">
          <ProfileForm />
        </div>
      </div>
    </>
  )
}