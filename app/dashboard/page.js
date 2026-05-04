'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [clients, setClients] = useState([])

  useEffect(() => {
    run()
  }, [])

  async function run() {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('clients')
      .select('*')

    console.log('RESULT:', data)
    console.log('ERROR:', error)

    setClients(data || [])
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>DEBUG DATI</h1>
      <div>Record: {clients.length}</div>
    </div>
  )
}