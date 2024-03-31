import { Database } from '@/types/database.types'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { atom, useAtomValue } from 'jotai'

const supabase = atom(createClientComponentClient<Database>());

export const useSupabase = () => {
  return useAtomValue(supabase)
}
