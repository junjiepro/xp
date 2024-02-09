'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa, ViewType } from '@supabase/auth-ui-shared'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database.types'
import { useTheme } from 'next-themes'

export default function AuthForm({ view }: { view: ViewType }) {
  const supabase = createClientComponentClient<Database>()
  const { theme } = useTheme()
  return (
    <Auth
      supabaseClient={supabase}
      view={view}
      appearance={{
        theme: ThemeSupa, variables: {
          default: {
            colors: {
              brand: 'black',
              brandAccent: 'black',
            },
          },
        },
      }}
      theme={theme === 'dark' ? 'dark' : "default"}
      showLinks={false}
      providers={[]}
    />
  )
}