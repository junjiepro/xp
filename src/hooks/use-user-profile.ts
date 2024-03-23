import { Database } from '@/types/database.types'
import { atom, useAtomValue, useSetAtom } from 'jotai'

const userProfile = atom<Database['public']['Tables']['user_profiles']['Row'] | null>(null)

export const useUserProfile = () => {
  return useAtomValue(userProfile)
}

export const useSetUserProfile = () => {
  return useSetAtom(userProfile)
}