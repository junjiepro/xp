"use client"

import * as React from "react"
import {
  BaggageClaim,
  CheckIcon,
  Loader2,
  PlusCircle,
} from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  AvatarFallback,
} from "@/components/avatar"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useSession, useSupabase } from "./supabase-provider"
import { useTranslation } from "next-export-i18n"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useOrganizations, useSetOrganizations } from "@/hooks/use-organizations"
import { getCurrentUserOrganizations } from "@/lib/server"
import { toast } from "sonner"

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface OrganizationSwitcherProps extends PopoverTriggerProps { }

export default function OrganizationSwitcher({ className }: OrganizationSwitcherProps) {
  const { t } = useTranslation();
  const supbase = useSupabase();
  const session = useSession();
  const userProfile = useUserProfile();
  const organizations = useOrganizations();
  const setOrganizations = useSetOrganizations();

  // 获取当前 query 参数
  const { pathname, searchParams } = new URL(window.location.href);

  // 获取当前用户所在的组织
  const groups = React.useMemo(() => [{
    label: t("organization.personal_account"),
    teams: [
      {
        label: userProfile?.username || session?.user.email || '',
        value: "",
      },
    ],
  }, {
    label: t("organization.organizations"),
    teams: organizations.map((organization) => ({
      label: organization.name,
      value: organization.id,
    })),
  }], [t, userProfile?.username, session?.user.email, organizations]);
  const [open, setOpen] = React.useState(false)
  const [showNewOrganizationDialog, setShowNewOrganizationDialog] = React.useState(false)
  const [selectedOrganization, setSelectedOrganization] = React.useState<{ label: string, value: string } | undefined>()

  const formSchema = z.object({
    name: z.string().min(2, {
      message: t("organization.formSchema.name.min"),
    }).max(50, {
      message: t("organization.formSchema.name.max"),
    })
  })
  const [processing, setProcessing] = React.useState(false);
  // 1. Define form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    createOrganization(values.name);
  }

  const createOrganization = async (name: string) => {
    if (name && userProfile) {
      setProcessing(true);
      const { error: error1 } = await supbase.from('organizations').insert({ name, created_by: userProfile.id });
      if (!error1) {
        setShowNewOrganizationDialog(false);
        const { data: nextOrganizations, error: error2 } = await getCurrentUserOrganizations(supbase, userProfile.id);
        if (!error2) {
          setOrganizations(nextOrganizations);
          setShowNewOrganizationDialog(false);
        } else {
          toast.error(error2.message);
          console.log(error2);
        }
      } else {
        toast.error(error1.message);
        console.log(error1);
      }
      setProcessing(false);
    }
  }

  React.useEffect(() => {
    if (groups.length && selectedOrganization === undefined) {
      setSelectedOrganization(groups[0].teams[0])
    } else if (groups.length && selectedOrganization) {
      groups.forEach((group) => {
        group.teams.forEach((team) => {
          if (team.value === selectedOrganization.value && team.label !== selectedOrganization.label) {
            setSelectedOrganization(team)
          }
        })
      })
    }
  }, [groups, selectedOrganization])

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
                <AvatarFallback label={selectedOrganization.label} />
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
                        <AvatarFallback label={team.label} />
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DialogHeader>
              <DialogTitle>{t("organization.create_organization")}</DialogTitle>
              <DialogDescription>
                {t("organization.create_organization_description")}
              </DialogDescription>
            </DialogHeader>
            <div>
              <div className="space-y-4 py-2 pb-4">
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("organization.name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("organization.name_placeholder")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewOrganizationDialog(false)}>
                {t("action.cancel")}
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("action.continue")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}