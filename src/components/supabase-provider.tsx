'use client'

import { createContext, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSetUserProfile } from '@/hooks/use-user-profile'
import { useSetOrganizations, useSetRoles } from '@/hooks/use-organizations'
import { createNewDevice, getCurrentUserOrganizations, getCurrentUserProfile, getCurrentUserRoles, getDevices, triggerDeviceUsed } from '@/lib/server'
import { toast } from 'sonner'
import { useSupabase } from '@/hooks/use-supabase'
import { useSession, useSetSession } from '@/hooks/use-session'
import { useSetXpDatas, useXpDatas } from '@/hooks/use-datas'
import { XpUserData } from '@/types/datas.types'
import { useSetDevices } from '@/hooks/use-devices'
import { UserNav } from './user-nav'
import { Search } from './search'
import { MainNav } from './main-nav'
import OrganizationSwitcher from './organization-switcher'

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
  const setRoles = useSetRoles();
  const xpDatas = useXpDatas();
  const setXpDatas = useSetXpDatas();
  const setDevices = useSetDevices();
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
        setRoles([])
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
          getCurrentUserRoles(supabase, _session?.user.id).then(({ data, error }) => {
            if (data) {
              setRoles(data)
            } else {
              setRoles([])
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

  const refreshDevice = () => {
    getDevices(supabase).then(({ data, error }) => {
      if (error) {
        toast.error(error.message)
        console.log(error)
      } else if (data) {
        setDevices(data)
      }
    })
  }
  useEffect(() => {
    if (session?.user.id && xpDatas && !xpDatas[session.user.id]) {
      const userData: XpUserData = {
        server: {
          type: 'supabase'
        },
        device: {
          id: '',
          name: ''
        }
      }
      setXpDatas({
        ...xpDatas, [session.user.id]: userData
      });
    } else if (session?.user.id && xpDatas && xpDatas[session.user.id]) {
      const xpUserData = xpDatas[session.user.id];
      if (xpUserData && xpUserData.server?.type === 'supabase' && !xpUserData.device.id) {
        createNewDevice(supabase, {}).then(({ data, error }) => {
          if (error) {
            toast.error(error.message)
            console.log(error)
          } else if (data) {
            setXpDatas({
              ...xpDatas, [session.user.id]: {
                ...xpUserData,
                device: {
                  id: data?.id || '',
                  name: (data?.data as any)?.name || ''
                }
              }
            })
            refreshDevice();
          }
        })
      } else if (xpUserData && xpUserData.server?.type === 'supabase' && xpUserData.device.id) {
        triggerDeviceUsed(supabase, xpUserData.device.id).then(({ error }) => {
          if (error) {
            toast.error(error.message)
            console.log(error)
          }
        })
        refreshDevice();
      }
    }
  }, [xpDatas, session?.user.id])

  return (
    <Context.Provider value={undefined}>
      {session?.user ? <div className="flex-col flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <OrganizationSwitcher />
            <MainNav className="hidden md:block mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <UserNav />
            </div>
          </div>
        </div>
        <>{children}</>
      </div> : <>{children}</>}
    </Context.Provider>
  )
}
