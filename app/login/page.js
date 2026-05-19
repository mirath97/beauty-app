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
    try {
      setLoading(true)

      const supabase = getSupabase()

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        })

      if (error) {
        alert(error.message)
        return
      }

      router.push('/dashboard')
    }

    catch (err) {
      console.error(err)
      alert('Errore login')
    }

    finally {
      setLoading(false)
    }
  }

  async function register() {
    try {
      setLoading(true)

      const supabase = getSupabase()

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim()
        })

      console.log(data)

      if (error) {
        console.error(error)

        alert(error.message)

        return
      }

      alert('Account creato con successo!')

      router.push('/dashboard')
    }

    catch (err) {
      console.error(err)

      alert('Errore registrazione')
    }

    finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">

      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm space-y-4">

        <div className="text-center">

          <h1 className="text-3xl font-bold text-pink-600">
            BeautyLab 💅
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Gestionale Beauty
          </p>

        </div>

        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={e =>
            setEmail(e.target.value)
          }
          className="w-full border p-3 rounded-xl"
        />

        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={e =>
            setPassword(e.target.value)
          }
          className="w-full border p-3 rounded-xl"
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-700 transition text-white p-3 rounded-xl"
        >
          {loading
            ? 'Caricamento...'
            : 'Login'}
        </button>

        <button
          onClick={register}
          disabled={loading}
          className="w-full border border-pink-600 text-pink-600 p-3 rounded-xl hover:bg-pink-50 transition"
        >
          Crea account
        </button>

      </div>

    </div>
  )
}