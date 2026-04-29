'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ServicesPage() {
  const [services, setServices] = useState([])

  const [nome, setNome] = useState('')
  const [prezzo, setPrezzo] = useState('')
  const [durata, setDurata] = useState('')

  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('nome')

    setServices(data || [])
  }

  async function addService() {
    await supabase.from('services').insert({
      nome,
      prezzo: Number(prezzo),
      durata: Number(durata)
    })

    setNome('')
    setPrezzo('')
    setDurata('')
    fetchServices()
  }

  async function updateService() {
    await supabase
      .from('services')
      .update({
        nome,
        prezzo: Number(prezzo),
        durata: Number(durata)
      })
      .eq('id', selected.id)

    setSelected(null)
    fetchServices()
  }

  async function deleteService(id) {
    await supabase.from('services').delete().eq('id', id)
    fetchServices()
  }

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold text-pink-700">
        Listino
      </h1>

      {/* AGGIUNGI */}
      <div className="flex gap-2">
        <input placeholder="Nome" value={nome} onChange={(e)=>setNome(e.target.value)} className="p-3 border rounded-xl"/>
        <input placeholder="€" value={prezzo} onChange={(e)=>setPrezzo(e.target.value)} className="p-3 border rounded-xl"/>
        <input placeholder="min" value={durata} onChange={(e)=>setDurata(e.target.value)} className="p-3 border rounded-xl"/>

        <button onClick={addService} className="bg-pink-500 text-white px-4 rounded-xl">
          +
        </button>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {services.map(s => (
          <div
            key={s.id}
            onClick={() => {
              setSelected(s)
              setNome(s.nome)
              setPrezzo(s.prezzo)
              setDurata(s.durata)
            }}
            className="p-4 bg-white rounded-2xl shadow border border-pink-100 cursor-pointer flex justify-between"
          >
            <div>
              <div className="text-pink-700 font-semibold">{s.nome}</div>
              <div className="text-sm text-gray-400">
                € {s.prezzo} • {s.durata} min
              </div>
            </div>

            <button
              onClick={(e)=>{
                e.stopPropagation()
                deleteService(s.id)
              }}
              className="text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* MODALE */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl space-y-4">

            <input value={nome} onChange={(e)=>setNome(e.target.value)} className="w-full p-3 border rounded-xl"/>
            <input value={prezzo} onChange={(e)=>setPrezzo(e.target.value)} className="w-full p-3 border rounded-xl"/>
            <input value={durata} onChange={(e)=>setDurata(e.target.value)} className="w-full p-3 border rounded-xl"/>

            <div className="flex gap-2">
              <button onClick={()=>setSelected(null)} className="flex-1 p-3 bg-gray-200 rounded-xl">
                Chiudi
              </button>

              <button onClick={updateService} className="flex-1 p-3 bg-pink-500 text-white rounded-xl">
                Salva
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}