import { Database } from '@/types/database.types'
import { atom, useAtomValue, useSetAtom } from 'jotai'

const devices = atom<Database['public']['Tables']['user_devices']['Row'][]>([])

export const useDevices = () => {
  return useAtomValue(devices)
}

export const useSetDevices = () => {
  return useSetAtom(devices)
}