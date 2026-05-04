'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function AIPage() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createSupabaseClient()

    const { data } = await supabase
      .from('appointments')
      .select(`
        clients (nome),
        appointment_services (services (nome))
      `)

    setData(data || [])
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-pink-700">AI Business</h1>

      <div className="mt-2">
        Appuntamenti analizzati: {data.length}
      </div>
    </div>
  )
}