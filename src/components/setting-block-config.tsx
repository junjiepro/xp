"use client";

import React from "react";
import { Input, InputProps } from "@/components/ui/input";
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
  Search,
  X,
  ReplaceAll,
  ArrowRight,
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
import { ScrollArea } from "./ui/scroll-area";
import ReactJson, { ReactJsonViewProps } from "react-json-view";
import { useTheme } from "next-themes";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

function DelayInput({
  value,
  onChange,
  ...props
}: Omit<InputProps, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const [innerValue, setInnerValue] = React.useState(value);
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(innerValue);
    }, 500);
    return () => clearTimeout(timeout);
  }, [innerValue, onChange]);

  React.useEffect(() => {
    setInnerValue(value);
  }, [value]);
  return (
    <Input
      {...props}
      value={innerValue}
      onChange={(e) => setInnerValue(e.target.value)}
    />
  );
}

function DefaultBlockRenderer<T extends object>(
  block: EdittingBlock<T> | undefined,
  setBlock: (block: EdittingBlock<T> | undefined) => void,
  emptyBlock: T,
  copy: (source: T) => T
) {
  const { theme } = useTheme();

  const [isPending, startTransition] = React.useTransition();
  const [obj, setObj] = React.useState<object>({});
  const [queriedIndex, setQueriedIndex] = React.useState<number[]>([]);

  const [query, setQuery] = React.useState<string>("");

  React.useEffect(() => {
    startTransition(() => {
      let nextObj = block?.block || copy(emptyBlock);
      const nextQueriedIndex: number[] = [];
      if (query) {
        if (Array.isArray(nextObj)) {
          nextObj = nextObj.filter((item, i) => {
            const s =
              typeof item === "object" ? JSON.stringify(item) : item.toString();
            const isMatch = s.includes(query);
            if (isMatch) {
              nextQueriedIndex.push(i);
            }
            return isMatch;
          }) as T;
        } else if (typeof nextObj === "object") {
          nextObj = Object.entries(nextObj)
            .filter(([k, v]) => {
              const s =
                typeof v === "object" ? JSON.stringify(v) : v.toString();
              return s.includes(query);
            })
            .reduce((obj, [k, v]) => ({ ...obj, [k]: v }), {}) as T;
        }
      }
      setObj(nextObj);
      setQueriedIndex(nextQueriedIndex);
    });
  }, [block?.block, query]);

  const onEdit: ReactJsonViewProps["onEdit"] = (edit) => {
    console.log(edit);
    const b = block?.block || copy(emptyBlock);
    let nextBlock = edit.updated_src as T;
    if (query) {
      if (Array.isArray(nextBlock) && Array.isArray(b)) {
        const temp = [...b];
        // Delete item
        if (
          edit.new_value === undefined &&
          edit.namespace.length === 0 &&
          edit.name
        ) {
          let i = parseInt(edit.name);
          if (i >= 0 && i < queriedIndex.length) {
            i = queriedIndex[i];
            temp.splice(i, 1);
          }
        } else {
          nextBlock.forEach((item, i) => {
            temp[queriedIndex[i]] = item;
          });
        }

        nextBlock = temp as T;
      } else if (typeof nextBlock === "object" && typeof b === "object") {
        const temp: any = { ...b };
        Object.entries(nextBlock).forEach(([k, v]) => {
          temp[k] = v;
        });
        // Delete key
        if (
          edit.new_value === undefined &&
          edit.namespace.length === 0 &&
          edit.name
        ) {
          delete temp[edit.name];
        }

        nextBlock = temp;
      }
    }
    const next = {
      ...block,
      id: block?.id || "",
      block: nextBlock,
      access: {
        ...block?.access,
        owners: [...(block?.access?.owners || [])],
        roles: [...(block?.access?.roles || [])],
      },
    };
    setBlock(next);
  };

  const [source, setSource] = React.useState<string>("");
  const [target, setTarget] = React.useState<string>("");
  const replaceAll = () => {
    if (source) {
      const b = block?.block || copy(emptyBlock);
      let nextBlock = b;
      try {
        const t = JSON.stringify(b).replaceAll(source, target);
        nextBlock = JSON.parse(t);
      } catch (e) {
        console.error(e);
      }
      const next = {
        ...block,
        id: block?.id || "",
        block: nextBlock,
        access: {
          ...block?.access,
          owners: [...(block?.access?.owners || [])],
          roles: [...(block?.access?.roles || [])],
        },
      };
      setBlock(next);
    }
  };
  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-center gap-2">
        <Search className="h-4 w-4 mx-4" />
        <DelayInput placeholder="query" value={query} onChange={setQuery} />
        <Button
          variant={"ghost"}
          onClick={(e) => {
            e.preventDefault();
            setQuery("");
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center justify-center gap-2">
        <DelayInput placeholder="source" value={source} onChange={setSource} />
        <ArrowRight className="h-4 w-4" />
        <DelayInput placeholder="target" value={target} onChange={setTarget} />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={"ghost"}
              disabled={isPending || !source}
              onClick={(e) => {
                e.preventDefault();
                replaceAll();
              }}
            >
              <ReplaceAll className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Replace all</TooltipContent>
        </Tooltip>
      </div>
      <ReactJson
        name="settings"
        theme={theme === "dark" ? "monokai" : "rjv-default"}
        collapsed={!query}
        src={obj}
        onEdit={isPending ? undefined : onEdit}
        onAdd={isPending || query ? undefined : onEdit}
        onDelete={isPending ? undefined : onEdit}
      />
    </div>
  );
}

function SettingBlockConfig<T extends object>({
  settingsOpened,
  organizationId,
  blocks,
  mutateBlock,
  emptyBlock,
  copy,
  blockRenderer,
}: {
  settingsOpened: boolean;
  organizationId: string;
  blocks: SettingBlockHandler<T>["blocks"];
  mutateBlock: SettingBlockHandler<T>["mutateBlock"];
  emptyBlock: T;
  copy: (source: T) => T;
  blockRenderer?: (
    block: EdittingBlock<T> | undefined,
    setBlock: (block: EdittingBlock<T> | undefined) => void
  ) => React.ReactNode;
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

  const [localSettings, setLocalSettings] = React.useState<EdittingBlock<T>>();
  const [localSettingsUpdating, setLocalSettingsUpdating] =
    React.useState(false);
  const saveLocalSettings = () => {
    if (localSettingsUpdating || !localSettings) {
      return;
    }
    setLocalSettingsUpdating(true);
    mutateBlock(localSettings, "local").then(() =>
      setLocalSettingsUpdating(false)
    );
  };

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
  const [openDelete, setOpenDelete] = React.useState(false);
  const savePublicSettings = () => {
    if (publicSettingsUpdating || !publicSettings) {
      return;
    }
    setPublicSettingsUpdating(true);
    mutateBlock(publicSettings, "public").then((id) => {
      setPublicSettingsUpdating(false);
      if (id && !publicSettings?.id) {
        setPublicSettings(editableBlocks.find((b) => b.id === id));
      }
    });
  };
  const deletePublicSettings = () => {
    if (publicSettingsUpdating || !publicSettings || !is_admin) {
      return;
    }
    setPublicSettingsUpdating(true);
    mutateBlock(publicSettings, "public", true).then(() => {
      setPublicSettingsUpdating(false);
      setOpenDelete(false);
      setPublicSettings({
        id: "",
        block: copy(emptyBlock),
        access: { owners: [], roles: [] },
      });
    });
  };
  const roleValue = React.useMemo(() => {
    const selectedRoleIds = publicSettings?.access?.roles || [];
    const selectedOwnerIds = publicSettings?.access?.owners || [];
    const selectedRoles =
      organizationRoles?.filter((r) => selectedRoleIds.includes(r.id)) || [];
    const selectedOwners =
      organizationRoles?.filter((r) => selectedOwnerIds.includes(r.id)) || [];
    return { selectedRoles, selectedOwners };
  }, [publicSettings, organizationRoles]);
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
    <form className="grid w-full items-start gap-6 p-4 pt-0">
      <fieldset className="grid gap-6">
        <Tabs defaultValue="private">
          <TabsList className="grid w-full grid-cols-3 sticky top-0">
            <TabsTrigger value="local">Local</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
            <TabsTrigger
              value="public"
              disabled={!is_admin && !editableBlocks.length}
            >
              Public
            </TabsTrigger>
          </TabsList>
          <TabsContent value="local">
            <Card>
              <CardHeader>
                <CardTitle>Local</CardTitle>
                <CardDescription>Your local settings here.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea viewportClassName="max-h-[calc(90vh-350px)] mx-[-8px]">
                  <div className="space-y-2 p-2">
                    {blockRenderer
                      ? blockRenderer(localSettings, setLocalSettings)
                      : DefaultBlockRenderer(
                          localSettings,
                          setLocalSettings,
                          emptyBlock,
                          copy
                        )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button
                  disabled={localSettingsUpdating}
                  onClick={() => saveLocalSettings()}
                >
                  {localSettingsUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="private">
            <Card>
              <CardHeader>
                <CardTitle>Private</CardTitle>
                <CardDescription>Your private settings here.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea viewportClassName="max-h-[calc(90vh-350px)] mx-[-8px]">
                  <div className="space-y-2 p-2">
                    {blockRenderer
                      ? blockRenderer(privateSettings, setPrivateSettings)
                      : DefaultBlockRenderer(
                          privateSettings,
                          setPrivateSettings,
                          emptyBlock,
                          copy
                        )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Button
                  disabled={privateSettingsUpdating}
                  onClick={() => savePrivateSettings()}
                >
                  {privateSettingsUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
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
              <CardContent>
                <ScrollArea viewportClassName="max-h-[calc(90vh-350px)] mx-[-8px]">
                  <div className="space-y-2 p-2">
                    {blockRenderer
                      ? blockRenderer(publicSettings, setPublicSettings)
                      : DefaultBlockRenderer(
                          publicSettings,
                          setPublicSettings,
                          emptyBlock,
                          copy
                        )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    disabled={publicSettingsUpdating}
                    onClick={() => savePublicSettings()}
                  >
                    {publicSettingsUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Save changes
                  </Button>
                  {publicSettings?.id ? (
                    <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                      <DialogTrigger asChild>
                        <Button
                          variant={"destructive"}
                          disabled={publicSettingsUpdating || !is_admin}
                        >
                          {publicSettingsUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[300px] rounded-lg">
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
                  ) : null}
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
                        <div className="p-2 text-sm flex flex-wrap items-center gap-2">
                          {roleValue.selectedOwners.length ? (
                            roleValue.selectedOwners.map((r) => (
                              <Badge key={r.id} variant={"default"}>
                                {r.name}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant={"secondary"}>
                              {"select roles..."}
                            </Badge>
                          )}
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
                                  onSelect={() => {
                                    setPublicSettings((prev) => {
                                      if (!prev) {
                                        return prev;
                                      }
                                      return {
                                        ...prev,
                                        access: {
                                          ...prev.access,
                                          owners: prev.access.owners.includes(
                                            r.id
                                          )
                                            ? prev.access.owners.filter(
                                                (id) => id !== r.id
                                              )
                                            : [...prev.access.owners, r.id],
                                        },
                                      };
                                    });
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      publicSettings?.access?.owners?.includes(
                                        r.id
                                      )
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
                      <div className="p-2 text-sm flex flex-wrap items-center gap-2">
                        {roleValue.selectedRoles.length ? (
                          roleValue.selectedRoles.map((r) => (
                            <Badge key={r.id} variant={"default"}>
                              {r.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant={"secondary"}>
                            {"select roles..."}
                          </Badge>
                        )}
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
                                onSelect={() => {
                                  setPublicSettings((prev) => {
                                    if (!prev) {
                                      return prev;
                                    }
                                    return {
                                      ...prev,
                                      access: {
                                        ...prev.access,
                                        roles: prev.access.roles.includes(r.id)
                                          ? prev.access.roles.filter(
                                              (id) => id !== r.id
                                            )
                                          : [...prev.access.roles, r.id],
                                      },
                                    };
                                  });
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    publicSettings?.access?.roles?.includes(
                                      r.id
                                    )
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
  );
}

function SettingBlockConfigDrawer<T extends object>({
  title,
  description,
  children,
  ...props
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  organizationId: string;
  blocks: SettingBlockHandler<T>["blocks"];
  mutateBlock: SettingBlockHandler<T>["mutateBlock"];
  emptyBlock: T;
  copy: (source: T) => T;
  blockRenderer?: (
    block: EdittingBlock<T> | undefined,
    setBlock: (block: EdittingBlock<T> | undefined) => void
  ) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [settingsOpened, setSettingsOpened] = React.useState(false);

  return (
    <Drawer open={settingsOpened} onOpenChange={setSettingsOpened}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <SettingBlockConfig settingsOpened={settingsOpened} {...props} />
      </DrawerContent>
    </Drawer>
  );
}

function SettingBlockConfigDialog<T extends object>({
  title,
  description,
  children,
  ...props
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  organizationId: string;
  blocks: SettingBlockHandler<T>["blocks"];
  mutateBlock: SettingBlockHandler<T>["mutateBlock"];
  emptyBlock: T;
  copy: (source: T) => T;
  blockRenderer?: (
    block: EdittingBlock<T> | undefined,
    setBlock: (block: EdittingBlock<T> | undefined) => void
  ) => React.ReactNode;
  children: React.ReactNode;
}) {
  const [settingsOpened, setSettingsOpened] = React.useState(false);

  return (
    <Dialog open={settingsOpened} onOpenChange={setSettingsOpened}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[90vw] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SettingBlockConfig settingsOpened={settingsOpened} {...props} />
      </DialogContent>
    </Dialog>
  );
}

export { SettingBlockConfigDrawer, SettingBlockConfigDialog };
