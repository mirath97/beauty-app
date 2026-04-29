'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleSignup() {
    const { error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Account creato! Ora fai login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">

      <div className="bg-white p-6 rounded-2xl shadow w-full max-w-sm space-y-4">

        <h1 className="text-2xl font-bold text-pink-700 text-center">
          Login
        </h1>

        <input
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
          onClick={handleLogin}
          className="bg-pink-600 text-white w-full p-3 rounded-xl"
        >
          Accedi
        </button>

        <button
          onClick={handleSignup}
          className="text-pink-600 w-full"
        >
          Crea account
        </button>

      </div>

    </div>
  )
}