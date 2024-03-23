'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, SupabaseClient, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { Database } from '../types/database.types'
import { useSetUserProfile } from '@/hooks/use-user-profile'
import { useSetOrganizations } from '@/hooks/use-organizations'
import { getCurrentUserOrganizations, getCurrentUserProfile } from '@/lib/server'

type MaybeSession = Session | null

type SupabaseContext = {
  supabase: SupabaseClient<any, string>
  session: MaybeSession
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<MaybeSession>(null)
  const setUserProfile = useSetUserProfile();
  const setOrganizations = useSetOrganizations();
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, _session) => {
      if (!_session?.user && !pathname.startsWith('/auth/')) {
        router.replace('/auth/sign-in')
        setUserProfile(null)
        setOrganizations([])
        setSession(_session)
      } else if (_session?.access_token !== session?.access_token) {
        if (!pathname.startsWith('/auth/')) {
          // router.refresh()
        } else {
          router.replace('/')
        }
        if (_session?.user.id && _session?.user.id !== session?.user.id) {
          getCurrentUserProfile(supabase, _session?.user.id).then(({ data, error }) => {
            if (data) {
              setUserProfile(data)
            } else {
              setUserProfile(null)
            }
            if (error) {
              console.log(error)
            }
          })
          getCurrentUserOrganizations(supabase, _session?.user.id).then(({ data, error }) => {
            if (data) {
              setOrganizations(data)
            } else {
              setOrganizations([])
            }
            if (error) {
              console.log(error)
            }
          })
        }
        setSession(_session)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase, session, pathname])

  return (
    <Context.Provider value={{ supabase, session }}>
      <>{children}</>
    </Context.Provider>
  )
}

export const useSupabase = <
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
  ? 'public'
  : string & keyof Database
>() => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }

  return context.supabase as SupabaseClient<Database, SchemaName>
}

export const useSession = () => {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useSession must be used inside SupabaseProvider')
  }

  return context.session
}
