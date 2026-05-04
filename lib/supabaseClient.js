'use client'

import { createClient } from '@supabase/supabase-js'

export function createSupabaseClient() {
  // 🔥 blocca esecuzione lato server (build)
  if (typeof window === 'undefined') {
    return null
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('❌ Supabase ENV mancanti')
    return null
  }

  return createClient(url, key)
}