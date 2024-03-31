'use client'

import { createContext, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSetUserProfile } from '@/hooks/use-user-profile'
import { useSetOrganizations } from '@/hooks/use-organizations'
import { getCurrentUserOrganizations, getCurrentUserProfile } from '@/lib/server'
import { toast } from 'sonner'
import { useSupabase } from '@/hooks/use-supabase'
import { useSession, useSetSession } from '@/hooks/use-session'

const Context = createContext<undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const session = useSession();
  const setSession = useSetSession();
  const setUserProfile = useSetUserProfile();
  const setOrganizations = useSetOrganizations();
  const supabase = useSupabase();
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
              toast.error(error.message)
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
              toast.error(error.message)
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
    <Context.Provider value={undefined}>
      <>{children}</>
    </Context.Provider>
  )
}
