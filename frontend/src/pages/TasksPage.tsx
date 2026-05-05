import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { usePartyStore } from '@/store/partyStore'
import { useTasksStore } from '@/store/tasksStore'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Button, TaskCardSkeleton } from '@/components/ui'
import type { Task, TaskFormData } from '@/types'

type Modal = { mode: 'create' } | { mode: 'edit'; task: Task } | null

export function TasksPage() {
  const { profile, fetchProfile } = useAuthStore()
  const { members, weeklyXp, arcProgress } = usePartyStore()
  const { tasks, completions, loading, error, fetchTasks, fetchTodayCompletions, createTask, updateTask, deleteTask, completeTask, uncompleteTask } = useTasksStore()

  const [modal, setModal]           = useState<Modal>(null)
  const [saving, setSaving]         = useState(false)
  const [filter, setFilter]         = useState<'all' | 'pending' | 'done'>('all')
  const [showRetry, setShowRetry]   = useState(false)
  const retryTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    loadTasks(profile.id)
    fetchTodayCompletions(profile.id)
  }, [profile?.id])

  // Show retry button after 2s of loading
  useEffect(() => {
    if (loading) {
      setShowRetry(false)
      retryTimerRef.current = setTimeout(() => setShowRetry(true), 2000)
    } else {
      setShowRetry(false)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    }
  }, [loading])

  async function loadTasks(userId: string) {
    setShowRetry(false)
    await fetchTasks(userId)
  }

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
      const result = await createTask(profile.id, data)
      if (result) setModal(null)  // only close if successful
    } catch (e) {
      console.error('handleCreate error:', e)
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
    } catch (e) {
      console.error('handleEdit error:', e)
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(task: Task) {
    if (!profile?.party_id) return null

    const myWeeklyXp     = weeklyXp.find(w => w.user_id === profile.id)
    const memberWithChar = members.find(m => m.id === profile.id)

    const result = await completeTask({
      task,
      userId:                 profile.id,
      partyId:                profile.party_id,
      memberCount:            members.length,
      weeklyXpUsed:           myWeeklyXp?.xp_used ?? 0,
      bonusType:              memberWithChar?.bonus_type ?? undefined,
      bonusPct:               memberWithChar?.bonus_pct ?? undefined,
      currentStreak:          profile.current_streak,
      lastActiveDate:         profile.last_active_date,
      consecutiveMissedDays:  profile.consecutive_missed_days,
    })

    await fetchProfile(profile.id)
    return result
  }

  async function handleUncomplete(taskId: string) {
    if (!profile?.party_id) return
    await uncompleteTask({ taskId, userId: profile.id, partyId: profile.party_id })
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
        <div className="flex flex-col gap-2 relative">
          {[...Array(4)].map((_, i) => <TaskCardSkeleton key={i} />)}

          {/* Retry button appears after 2s */}
          <AnimatePresence>
            {showRetry && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center
                           bg-parchment-100/80 backdrop-blur-sm rounded gap-3"
              >
                <p className="font-heading text-xs uppercase tracking-wide text-ink-500">
                  Taking longer than usual…
                </p>
                <button
                  onClick={() => profile && loadTasks(profile.id)}
                  className="font-heading text-xs uppercase tracking-wider text-sea-600
                             hover:text-sea-800 border border-sea-300 rounded px-4 py-2
                             transition-colors bg-parchment-50"
                >
                  ↻ Retry
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-heading text-sm uppercase tracking-wide text-ink-400 mb-1">
            Failed to load missions
          </p>
          <p className="font-body text-xs text-ink-400 italic mb-4">{error}</p>
          <button
            onClick={() => profile && loadTasks(profile.id)}
            className="font-heading text-xs uppercase tracking-wider text-sea-600 hover:text-sea-800
                       border border-sea-300 rounded px-3 py-1.5 transition-colors"
          >
            ↻ Retry
          </button>
        </div>
      ) : filtered.length === 0 && tasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📜</div>
          <p className="font-heading text-sm uppercase tracking-wide text-ink-400">
            No missions yet — add one!
          </p>
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
                arcCompleted={arcProgress?.status === 'completed'}
                onComplete={handleComplete}
                onUncomplete={handleUncomplete}
                onEdit={task => setModal({ mode: 'edit', task })}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink-900/40 z-40 backdrop-blur-sm"
              onClick={() => !saving && setModal(null)}
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
                <button
                  onClick={() => !saving && setModal(null)}
                  className="text-ink-400 hover:text-ink-700 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <TaskForm
                initialData={modal.mode === 'edit' ? modal.task : undefined}
                onSubmit={modal.mode === 'create' ? handleCreate : handleEdit}
                onCancel={() => !saving && setModal(null)}
                loading={saving}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}