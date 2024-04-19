import { XpDatas } from '@/types/datas.types'
import { useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export const xpDatas = atomWithStorage<XpDatas>('xp-datas', {})

export const useXpDatas = () => {
  return useAtomValue(xpDatas)
}

export const useSetXpDatas = () => {
  return useSetAtom(xpDatas)
}
