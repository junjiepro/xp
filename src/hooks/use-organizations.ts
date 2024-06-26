import { Database } from "@/types/database.types";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const organizations = atom<
  Database["public"]["Tables"]["organizations"]["Row"][]
>([]);
const roles = atom<
  Database["public"]["Views"]["user_role_with_organizations"]["Row"][]
>([]);

const organizationLayout = atomWithStorage<{
  layout: number[];
  collapsed: boolean;
}>("organization-layout", {
  layout: [265, 1095],
  collapsed: true,
});

export const useOrganizations = () => {
  return useAtomValue(organizations);
};

export const useSetOrganizations = () => {
  return useSetAtom(organizations);
};

export const useRoles = () => {
  return useAtomValue(roles);
};

export const useSetRoles = () => {
  return useSetAtom(roles);
};

export const useOrganizationLayout = () => {
  return useAtomValue(organizationLayout);
};

export const useSetOrganizationLayout = () => {
  return useSetAtom(organizationLayout);
};
