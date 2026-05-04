'use client'

import { createClient } from '@supabase/supabase-js'

let _client

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.error('❌ ENV mancanti', { url, key })
    }

    _client = createClient(url, key)
  }
  return _client
}