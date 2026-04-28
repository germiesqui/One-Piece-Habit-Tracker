import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { usePartyStore } from '@/store/partyStore'
import { useTasksStore } from '@/store/tasksStore'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Button, Spinner, Divider } from '@/components/ui'
import type { Task, TaskFormData } from '@/types'

type Modal = { mode: 'create' } | { mode: 'edit'; task: Task } | null

export function TasksPage() {
  const { profile, fetchProfile } = useAuthStore()
  const { members, weeklyXp } = usePartyStore()
  const { tasks, completions, loading, fetchTasks, fetchTodayCompletions, createTask, updateTask, deleteTask, completeTask } = useTasksStore()

  const [modal, setModal] = useState<Modal>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')

  useEffect(() => {
    if (!profile?.id) return
    fetchTasks(profile.id)
    fetchTodayCompletions(profile.id)
  }, [profile?.id])

  const completedTaskIds = new Set(completions.map(c => c.task_id))

  const filtered = tasks.filter(task => {
    if (filter === 'pending') return !completedTaskIds.has(task.id)
    if (filter === 'done')    return completedTaskIds.has(task.id)
    return true
  })

  async function handleCreate(data: TaskFormData) {
    if (!profile) return
    setSaving(true)
    try {
      await createTask(profile.id, data)
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(data: TaskFormData) {
    if (modal?.mode !== 'edit') return
    setSaving(true)
    try {
      await updateTask(modal.task.id, data)
      setModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(task: Task) {
    if (!profile?.party_id) return

    const myWeeklyXp = weeklyXp.find(w => w.user_id === profile.id)
    const memberWithChar = members.find(m => m.id === profile.id)

    await completeTask({
      task,
      userId: profile.id,
      partyId: profile.party_id,
      memberCount: members.length,
      weeklyXpUsed: myWeeklyXp?.xp_used ?? 0,
      bonusType: memberWithChar?.bonus_type ?? undefined,
      bonusPct: memberWithChar?.bonus_pct ?? undefined,
      currentStreak: profile.current_streak,
      lastActiveDate: profile.last_active_date,
      consecutiveMissedDays: profile.consecutive_missed_days,
    })

    // Refresh profile to get updated stats
    await fetchProfile(profile.id)
  }

  async function handleDelete(taskId: string) {
    if (!confirm('Remove this mission from your log?')) return
    await deleteTask(taskId)
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-ink-900">Mission Log</h2>
          <p className="font-body text-xs text-ink-500 italic">
            {completedTaskIds.size} of {tasks.length} completed today
          </p>
        </div>
        <Button size="sm" onClick={() => setModal({ mode: 'create' })}>
          + New
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex rounded border border-parchment-300 overflow-hidden">
        {(['all', 'pending', 'done'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 font-heading text-[10px] uppercase tracking-wider transition-colors ${
              filter === f
                ? 'bg-ink-900 text-parchment-50'
                : 'bg-parchment-50 text-ink-500 hover:bg-parchment-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : filtered.length === 0 && tasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📜</div>
          <p className="font-heading text-sm uppercase tracking-wide text-ink-400 mb-4">
            No missions yet — add one!
          </p>
          <button
            onClick={() => profile && fetchTasks(profile.id)}
            className="font-heading text-xs uppercase tracking-wider text-sea-600 hover:text-sea-800
                       border border-sea-300 rounded px-3 py-1.5 transition-colors"
          >
            ↻ Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">✓</div>
          <p className="font-heading text-sm uppercase tracking-wide text-ink-400">
            {filter === 'done' ? 'No completed missions yet today' : 'All missions completed!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 relative">
          <AnimatePresence>
            {filtered.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                completedToday={completedTaskIds.has(task.id)}
                onComplete={handleComplete}
                onEdit={task => setModal({ mode: 'edit', task })}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink-900/40 z-40 backdrop-blur-sm"
              onClick={() => setModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-parchment-50 border-t border-parchment-300
                         rounded-t-xl p-5 pb-8 shadow-parchment-lg max-w-2xl mx-auto
                         max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-base text-ink-900">
                  {modal.mode === 'create' ? 'New Mission' : 'Edit Mission'}
                </h3>
                <button onClick={() => setModal(null)} className="text-ink-400 hover:text-ink-700 text-xl leading-none">
                  ×
                </button>
              </div>

              <TaskForm
                initialData={modal.mode === 'edit' ? modal.task : undefined}
                onSubmit={modal.mode === 'create' ? handleCreate : handleEdit}
                onCancel={() => setModal(null)}
                loading={saving}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}