import { Metadata } from "next"

import { MainNav } from "@/components/main-nav"
import { Search } from "@/components/search"
import OrganizationSwitcher from "@/components/organization-switcher"
import { UserNav } from "@/components/user-nav"
import DeviceOverview from "@/components/device-overview"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "XP - playgrounds, projects and more.",
}

export default function DashboardPage() {
  return (
    <>
      <div className="flex-col flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <OrganizationSwitcher />
            <MainNav className="hidden md:block mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <UserNav />
            </div>
          </div>
        </div>
        <DeviceOverview />
      </div>
    </>
  )
}