"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Loader2,
  ChevronsUpDown,
  Check,
  UserRoundCog,
  UserRoundCheck,
} from "lucide-react";
import { EdittingBlock, SettingBlockHandler } from "@/types/datas.types";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRoles } from "@/hooks/use-organizations";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/types/database.types";
import { getRoles } from "@/lib/server";

function SettingBlockConfigDrawer<T>({
  title,
  description,
  organizationId,
  blocks,
  mutateBlock,
  emptyBlock,
  copy,
  blockRenderer,
  children,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  organizationId: string;
  blocks: SettingBlockHandler<T>["blocks"];
  mutateBlock: SettingBlockHandler<T>["mutateBlock"];
  emptyBlock: T;
  copy: (source: T) => T;
  blockRenderer: (
    block: EdittingBlock<T> | undefined,
    setBlock: (block: EdittingBlock<T> | undefined) => void
  ) => React.ReactNode;
  children: React.ReactNode;
}) {
  const roles = useRoles();
  const is_admin = React.useMemo(
    () =>
      roles.some(
        (r) =>
          r.role_name?.toUpperCase() === "ADMINISTRATOR" &&
          r.organization_id === organizationId
      ),
    [roles, organizationId]
  );

  const editableBlocks = React.useMemo(
    () => blocks.public.filter((b) => !!b.is_admin || !!b.is_owner),
    [blocks]
  );

  const [settingsOpened, setSettingsOpened] = React.useState(false);
  const [privateSettings, setPrivateSettings] =
    React.useState<EdittingBlock<T>>();
  const [privateSettingsUpdating, setPrivateSettingsUpdating] =
    React.useState(false);
  const savePrivateSettings = () => {
    if (privateSettingsUpdating || !privateSettings) {
      return;
    }
    setPrivateSettingsUpdating(true);
    mutateBlock(privateSettings, "private").then(() =>
      setPrivateSettingsUpdating(false)
    );
  };
  const [organizationRoles, setOrganizationRoles] = React.useState<
    Database["public"]["Tables"]["roles"]["Row"][]
  >([]);
  const [publicSettingsOpened1, setPublicSettingsOpened1] =
    React.useState(false);
  const [publicSettings, setPublicSettings] =
    React.useState<EdittingBlock<T>>();
  const [publicSettingsUpdating, setPublicSettingsUpdating] =
    React.useState(false);
  const savePublicSettings = () => {
    if (publicSettingsUpdating || !publicSettings) {
      return;
    }
    setPublicSettingsUpdating(true);
    mutateBlock(publicSettings, "public").then(() =>
      setPublicSettingsUpdating(false)
    );
  };
  const deletePublicSettings = () => {
    if (publicSettingsUpdating || !publicSettings) {
      return;
    }
    setPublicSettingsUpdating(true);
    mutateBlock(publicSettings, "public", true).then(() =>
      setPublicSettingsUpdating(false)
    );
  };
  React.useEffect(() => {
    if (settingsOpened) {
      setPrivateSettings({
        id: blocks.private.id,
        block: copy(blocks.private.block),
        access: { ...blocks.private.access },
      });
      if (editableBlocks.length) {
        const p = editableBlocks[0];
        setPublicSettings({
          id: p.id,
          block: copy(p.block),
          access: { ...p.access },
        });
      } else if (is_admin) {
        setPublicSettings({
          id: "",
          block: copy(emptyBlock),
          access: { owners: [], roles: [] },
        });
      } else {
        setPublicSettings(undefined);
      }
      if (organizationId) {
        getRoles(organizationId).then((res) => {
          setOrganizationRoles(res.data || []);
        });
      }
    }
  }, [settingsOpened]);

  return (
    <Drawer open={settingsOpened} onOpenChange={setSettingsOpened}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <form className="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
          <fieldset className="grid gap-6">
            <Tabs defaultValue="private">
              <TabsList className="grid w-full grid-cols-2 sticky top-0">
                <TabsTrigger value="private">Private</TabsTrigger>
                <TabsTrigger
                  value="public"
                  disabled={!is_admin && !editableBlocks.length}
                >
                  Public
                </TabsTrigger>
              </TabsList>
              <TabsContent value="private">
                <Card>
                  <CardHeader>
                    <CardTitle>Private</CardTitle>
                    <CardDescription>
                      Your private settings here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {blockRenderer(privateSettings, setPrivateSettings)}
                  </CardContent>
                  <CardFooter>
                    <Button
                      disabled={privateSettingsUpdating}
                      onClick={() => savePrivateSettings()}
                    >
                      Save changes
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent
                value="public"
                className={cn(
                  "overflow-auto p-0",
                  !is_admin && !editableBlocks.length && "hidden"
                )}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-4">
                      <Input
                        className="border-transparent hover:border-border"
                        placeholder="Title of this public setting"
                        value={publicSettings?.access?.title || ""}
                        onChange={(e) =>
                          publicSettings &&
                          setPublicSettings({
                            ...publicSettings,
                            access: {
                              ...publicSettings.access,
                              title: e.target.value,
                            },
                          })
                        }
                      />
                      <p className="text-sm font-normal text-muted-foreground">
                        {publicSettings?.id === "" ? "Create" : "Editting"}
                      </p>
                      <Popover
                        open={publicSettingsOpened1}
                        onOpenChange={setPublicSettingsOpened1}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="justify-between"
                          >
                            <span className="truncate w-12">
                              {publicSettings
                                ? publicSettings.id === ""
                                  ? "New setting"
                                  : publicSettings.access?.title ||
                                    `Public ${
                                      editableBlocks.findIndex(
                                        (b) => b.id === publicSettings.id
                                      ) + 1
                                    }`
                                : "Select setting..."}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search setting..." />
                            <CommandList>
                              <CommandEmpty>No setting found.</CommandEmpty>
                              <CommandGroup>
                                {editableBlocks.map((b, i) => (
                                  <CommandItem
                                    key={b.id}
                                    value={b.access?.title || `Public ${i + 1}`}
                                    onSelect={() => {
                                      setPublicSettings({
                                        id: b.id,
                                        block: copy(b.block),
                                        access: {
                                          ...b.access,
                                        },
                                      });
                                      setPublicSettingsOpened1(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        publicSettings?.id === b.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {b.access?.title || `Public ${i + 1}`}
                                  </CommandItem>
                                ))}
                                <CommandSeparator />
                                <CommandItem
                                  value={"New setting"}
                                  onSelect={() => {
                                    setPublicSettings({
                                      id: "",
                                      block: copy(emptyBlock),
                                      access: {
                                        owners: [],
                                        roles: [],
                                      },
                                    });
                                    setPublicSettingsOpened1(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      publicSettings?.id === ""
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  New setting
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </CardTitle>
                    <CardDescription>
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Input
                            className="border-transparent hover:border-border"
                            placeholder="The description of this public setting for the organization."
                            value={publicSettings?.access?.description || ""}
                            onChange={(e) =>
                              publicSettings &&
                              setPublicSettings({
                                ...publicSettings,
                                access: {
                                  ...publicSettings.access,
                                  description: e.target.value,
                                },
                              })
                            }
                          />
                        </HoverCardTrigger>
                        <HoverCardContent>
                          <p>
                            {publicSettings?.access?.description ||
                              "The description of this public setting for the organization."}
                          </p>
                        </HoverCardContent>
                      </HoverCard>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {blockRenderer(publicSettings, setPublicSettings)}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="space-x-2">
                      <Button
                        disabled={publicSettingsUpdating}
                        onClick={() => savePublicSettings()}
                      >
                        Save changes
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant={"destructive"}
                            disabled={
                              publicSettingsUpdating ||
                              !is_admin ||
                              !publicSettings?.id
                            }
                          >
                            {publicSettingsUpdating ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Comfirm</DialogTitle>
                            <DialogDescription>
                              Do you confirm to delete this setting?
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className="my-4">
                            <Button
                              variant={"destructive"}
                              disabled={
                                publicSettingsUpdating ||
                                !is_admin ||
                                !publicSettings?.id
                              }
                              onClick={() => deletePublicSettings()}
                            >
                              {publicSettingsUpdating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Confirm
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-x-2">
                      {is_admin && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox">
                              <UserRoundCog className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <div className="p-2 text-sm flex flex-wrap items-center gap-1">
                              <Badge variant={"secondary"}>
                                {"select roles..."}
                              </Badge>
                              <div className="text-muted-foreground">
                                can edit this setting
                              </div>
                            </div>
                            <Command>
                              <CommandInput placeholder="Search roles..." />
                              <CommandList>
                                <CommandEmpty>No role found.</CommandEmpty>
                                <CommandGroup>
                                  {organizationRoles.map((r) => (
                                    <CommandItem
                                      key={r.id}
                                      value={r.name}
                                      onSelect={() => {}}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          publicSettings?.id === r.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {r.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox">
                            <UserRoundCheck className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <div className="p-2 text-sm flex flex-wrap items-center gap-1">
                            <Badge variant={"secondary"}>
                              {"select roles..."}
                            </Badge>
                            <div className="text-muted-foreground">
                              can use this setting
                            </div>
                          </div>
                          <Command>
                            <CommandInput placeholder="Search roles..." />
                            <CommandList>
                              <CommandEmpty>No role found.</CommandEmpty>
                              <CommandGroup>
                                {organizationRoles.map((r) => (
                                  <CommandItem
                                    key={r.id}
                                    value={r.name}
                                    onSelect={() => {}}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        publicSettings?.id === r.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {r.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </fieldset>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

export { SettingBlockConfigDrawer };
