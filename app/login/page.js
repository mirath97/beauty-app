'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert('Errore login')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-pink-50">

      <div className="bg-white p-6 rounded-xl shadow w-80 space-y-3">

        <h1 className="text-xl font-bold text-pink-700">
          Login
        </h1>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-2 w-full"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border p-2 w-full"
        />

        <button
          onClick={login}
          className="bg-pink-600 text-white w-full py-2 rounded"
        >
          Entra
        </button>

      </div>

    </div>
  )
}