import { useState } from 'react'
import SectionTitle from '../components/common/SectionTitle'
import Button from '../components/ui/Button'

function LoginPage() {
  const [email, setEmail] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <section className="max-w-md">
      <SectionTitle title="Login" subtitle="Connect this form to your auth service when ready." />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
          placeholder="you@example.com"
        />
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </section>
  )
}

export default LoginPage