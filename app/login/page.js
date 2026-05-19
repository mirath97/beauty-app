'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { getSupabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)

  async function login() {
    setLoading(true)

    const supabase = getSupabase()

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push('/dashboard')
  }

  async function register() {
    setLoading(true)

    const supabase = getSupabase()

    const { error } =
      await supabase.auth.signUp({
        email,
        password
      })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    alert('Account creato!')
  }

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">

      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm space-y-4">

        <h1 className="text-2xl font-bold text-center text-pink-600">
          BeautyLab 💅
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border p-3 rounded-xl"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border p-3 rounded-xl"
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-pink-600 text-white p-3 rounded-xl"
        >
          {loading
            ? 'Caricamento...'
            : 'Login'}
        </button>

        <button
          onClick={register}
          disabled={loading}
          className="w-full border border-pink-600 text-pink-600 p-3 rounded-xl"
        >
          Crea account
        </button>

      </div>

    </div>
  )
}