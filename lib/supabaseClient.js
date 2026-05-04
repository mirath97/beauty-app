'use client'

import { createClient } from '@supabase/supabase-js'

let client = null

export function getSupabase() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 👇 log una sola volta per capire cosa stai usando davvero
  console.log('ENV CHECK:', {
    url,
    hasKey: !!key
  })

  if (!url || !key) {
    throw new Error('❌ ENV Supabase mancanti')
  }

  client = createClient(url, key)
  return client
}