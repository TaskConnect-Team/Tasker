import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ClipboardList, Clock, Hourglass, Wallet, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import AnimatedNumber from '../../components/common/AnimatedNumber'
import SectionTitle from '../../components/common/SectionTitle'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    open: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0,
  })
  const [loading, setLoading] = useState(true)

  const cards = useMemo(
    () => [
      {
        key: 'open',
        label: 'Open Tasks',
        description: 'Pending requests awaiting assignment.',
        icon: ClipboardList,
        tab: 'open',
      },
      {
        key: 'assigned',
        label: 'Assigned',
        description: 'Tasker accepted and scheduled.',
        icon: Clock,
        tab: 'assigned',
      },
      {
        key: 'inProgress',
        label: 'In Progress',
        description: 'Tasks currently underway.',
        icon: Hourglass,
        tab: 'in-progress',
      },
      {
        key: 'completed',
        label: 'Completed',
        description: 'Finished tasks and closed work.',
        icon: CheckCircle2,
        tab: 'completed',
      },
      {
        key: 'cancelled',
        label: 'Cancelled',
        description: 'Tasks you cancelled or closed.',
        icon: XCircle,
        tab: 'cancelled',
      },
      {
        key: 'totalSpent',
        label: 'Total Spent',
        description: 'Paid tasks total across your orders.',
        icon: Wallet,
        prefix: '$',
      },
    ],
    []
  )

  useEffect(() => {
    if (!user) {
      return
    }

    let isMounted = true

    const fetchStats = async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/tasks/dashboard/customer')
        if (isMounted) {
          setStats({
            open: data?.open ?? 0,
            assigned: data?.assigned ?? 0,
            inProgress: data?.inProgress ?? 0,
            completed: data?.completed ?? 0,
            cancelled: data?.cancelled ?? 0,
            totalSpent: data?.totalSpent ?? 0,
          })
        }
      } catch (error) {
        if (isMounted) {
          setStats({
            open: 0,
            assigned: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
            totalSpent: 0,
          })
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      isMounted = false
    }
  }, [user])

  const handleNavigate = (tab) => {
    if (!tab) {
      return
    }

    navigate('/orders', { state: { activeTab: tab } })
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Dashboard"
        subtitle="Overview of your task workflow, status, and activity."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? cards.map((card) => (
              <div
                key={card.key}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="animate-pulse space-y-4">
                  <div className="h-10 w-10 rounded-2xl bg-slate-200" />
                  <div className="h-3 w-32 rounded-full bg-slate-200" />
                  <div className="h-8 w-24 rounded-full bg-slate-200" />
                  <div className="h-3 w-48 rounded-full bg-slate-200" />
                </div>
              </div>
            ))
          : cards.map((card) => {
              const Icon = card.icon
              const isClickable = Boolean(card.tab)
              const Wrapper = isClickable ? motion.button : motion.div

              return (
                <Wrapper
                  key={card.key}
                  type={isClickable ? 'button' : undefined}
                  onClick={isClickable ? () => handleNavigate(card.tab) : undefined}
                  whileHover={isClickable ? { y: -5 } : undefined}
                  transition={{ duration: 0.2 }}
                  className="group flex h-full flex-col gap-4 rounded-3xl border border-blue-500 bg-indigo-500 p-5 text-left text-white shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5 text-white" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                      {isClickable ? 'View' : 'Total'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">
                      {card.prefix ? <span>{card.prefix}</span> : null}
                      <AnimatedNumber value={stats[card.key] ?? 0} />
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{card.description}</p>
                  </div>
                </Wrapper>
              )
            })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Quick action</h2>
            <p className="text-sm text-slate-600">Create a task post from the starter route.</p>
          </div>
          <Button onClick={() => navigate('/post-task')}>Post Task</Button>
        </div>
      </div>
    </section>
  )
}

export default DashboardPage