import { atom, useAtomValue, useSetAtom } from 'jotai'
import { Session } from '@supabase/auth-helpers-nextjs'

type MaybeSession = Session | null;

const session = atom<MaybeSession>(null)

export const useSession = () => {
  return useAtomValue(session)
}

export const useSetSession = () => {
  return useSetAtom(session)
}
