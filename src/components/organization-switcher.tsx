"use client"

import * as React from "react"
import {
  BaggageClaim,
  CheckIcon,
  PlusCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSession, useSupabase } from "./supabase-provider"
import { useTranslation } from "next-export-i18n"

const groups = [
  {
    label: "Personal Account",
    teams: [
      {
        label: "Alicia Koch",
        value: "personal",
      },
    ],
  },
  {
    label: "Organizations",
    teams: [
      {
        label: "Acme Inc.",
        value: "acme-inc",
      },
      {
        label: "Monsters Inc.",
        value: "monsters",
      },
    ],
  },
]

type Organization = (typeof groups)[number]["teams"][number]

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface OrganizationSwitcherProps extends PopoverTriggerProps { }

export default function OrganizationSwitcher({ className }: OrganizationSwitcherProps) {
  const { t } = useTranslation();
  const supbase = useSupabase();
  const s = useSession();

  // TODO: 获取当前用户所在的组织
  const groups = React.useMemo(() => s?.user ? [{
    label: t("organization.personal_account"),
    teams: [
      {
        label: s.user.email || '',
        value: "",
      },
    ],
  }] : [], [s?.user, t]);
  const [open, setOpen] = React.useState(false)
  const [showNewOrganizationDialog, setShowNewOrganizationDialog] = React.useState(false)
  const [selectedOrganization, setSelectedOrganization] = React.useState<Organization | undefined>(
    s?.user ? groups[0].teams[0] : undefined
  )

  React.useEffect(() => {
    if (s?.user && selectedOrganization === undefined) {
      setSelectedOrganization(groups[0].teams[0])
    }
  }, [groups, s?.user, selectedOrganization])

  return (
    <Dialog open={showNewOrganizationDialog} onOpenChange={setShowNewOrganizationDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className={cn("w-[200px] justify-between", className)}
          >
            {selectedOrganization ?
              <><Avatar className="mr-2 h-5 w-5">
                <AvatarImage
                  src={`https://avatar.vercel.sh/${selectedOrganization.value}.png`}
                  alt={selectedOrganization.label}
                  className="grayscale"
                />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
                {selectedOrganization.label.slice(0, 10)}{selectedOrganization.label.length > 10 ? '...' : ''}</>
              : null}
            <BaggageClaim className="ml-auto h-4 w-4 shrink-0 opacity-50" />

          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder={t("organization.searching_organization")} />
              <CommandEmpty>{t("organization.no_organization_found")}</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.teams.map((team) => (
                    <CommandItem
                      key={team.value}
                      onSelect={() => {
                        setSelectedOrganization(team)
                        setOpen(false)
                      }}
                      className="text-sm"
                    >
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${team.value}.png`}
                          alt={team.label}
                          className="grayscale"
                        />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      {team.label}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedOrganization?.value === team.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowNewOrganizationDialog(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {t("organization.create_organization")}
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("organization.create_organization")}</DialogTitle>
          <DialogDescription>
            {t("organization.create_organization_description")}
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("organization.name")}</Label>
              <Input id="name" placeholder={t("organization.name_placeholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">{t("organization.subscription_plan")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">
                    <span className="font-medium">Free</span> -{" "}
                    <span className="text-muted-foreground">
                      Trial for two weeks
                    </span>
                  </SelectItem>
                  <SelectItem value="pro">
                    <span className="font-medium">Pro</span> -{" "}
                    <span className="text-muted-foreground">
                      $9/month per user
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewOrganizationDialog(false)}>
            {t("action.cancel")}
          </Button>
          <Button type="submit">{t("action.continue")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}