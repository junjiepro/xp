import { Database } from '@/types/database.types'
import { atom, useAtomValue, useSetAtom } from 'jotai'

const organizations = atom<Database['public']['Tables']['organizations']['Row'][]>([])
const roles = atom<Database['public']['Views']['user_role_with_organizations']['Row'][]>([])

export const useOrganizations = () => {
  return useAtomValue(organizations)
}

export const useSetOrganizations = () => {
  return useSetAtom(organizations)
}

export const useRoles = () => {
  return useAtomValue(roles)
}

export const useSetRoles = () => {
  return useSetAtom(roles)
}
