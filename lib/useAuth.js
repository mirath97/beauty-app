import { useEffect } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

export default function useAuth() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.push('/login')
      }
    })
  }, [])
}