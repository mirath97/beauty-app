'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabaseClient'

export default function AIPage() {
  const [data, setData] = useState([])
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('appointments')
      .select('*')

    setData(data || [])
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-pink-700">
        AI Business
      </h1>

      <div className="text-sm mt-2">
        Appuntamenti totali: {data.length}
      </div>
    </div>
  )
}