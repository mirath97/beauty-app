'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('clients')
      .select('*')

    console.log('DATA:', data)
    console.log('ERROR:', error)

    setData(data || [])
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-pink-700">
        TEST DATI
      </h1>

      <div className="mt-2">
        Record: {data.length}
      </div>

      {data.map((c, i) => (
        <div key={i}>
          {c.nome} - {c.telefono}
        </div>
      ))}
    </div>
  )
}