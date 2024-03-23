import { Database } from '@/types/database.types'
import { atom, useAtomValue, useSetAtom } from 'jotai'

const organizations = atom<Database['public']['Tables']['organizations']['Row'][]>([])

export const useOrganizations = () => {
  return useAtomValue(organizations)
}

export const useSetOrganizations = () => {
  return useSetAtom(organizations)
}