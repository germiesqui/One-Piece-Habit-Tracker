import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { DIFFICULTY_TIERS, TASK_TYPES } from '@/types'
import type { Task, Completion } from '@/types'
import { Button } from '@/components/ui'

interface TaskCardProps {
  task: Task
  completedToday?: boolean
  onComplete: (task: Task) => Promise<void>
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, completedToday, onComplete, onEdit, onDelete }: TaskCardProps) {
  const [completing, setCompleting] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const tier = DIFFICULTY_TIERS.find(t => t.level === task.difficulty)!
  const typeConfig = TASK_TYPES.find(t => t.key === task.task_type)!

  async function handleComplete() {
    if (completedToday || completing) return
    setCompleting(true)
    try {
      await onComplete(task)
      setShowXp(true)
      setTimeout(() => setShowXp(false), 2500)
    } catch (e) {
      console.error('handleComplete error:', e)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={clsx(
        'card-parchment overflow-hidden',
        completedToday && 'opacity-70'
      )}
    >
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Complete button */}
          <button
            onClick={handleComplete}
            disabled={completedToday || completing}
            className={clsx(
              'mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all',
              completedToday
                ? 'bg-sea-500 border-sea-600 text-white'
                : 'border-parchment-400 hover:border-sea-400 hover:bg-sea-50'
            )}
          >
            {completing ? (
              <svg className="animate-spin h-3 w-3 text-sea-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : completedToday ? (
              <span className="text-xs">✓</span>
            ) : null}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={clsx(
                  'font-heading text-sm font-semibold leading-tight',
                  completedToday ? 'line-through text-ink-400' : 'text-ink-900'
                )}>
                  {task.title}
                </h3>

                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className={clsx(
                    'task-badge text-[9px]',
                    'bg-parchment-200 text-ink-600 border border-parchment-300'
                  )}>
                    {typeConfig.emoji} {typeConfig.label}
                  </span>
                  <span className="task-badge text-[9px] bg-parchment-100 text-ink-500 border border-parchment-300">
                    {tier.emoji} {tier.name} · {tier.label}
                  </span>
                  <span className="font-mono text-[10px] text-sea-700">
                    +{tier.baseXp} XP
                  </span>
                </div>
              </div>

              {/* Repeat indicator */}
              {task.repeat_type !== 'none' && (
                <span className="font-heading text-[9px] uppercase tracking-wide text-parchment-600 bg-parchment-200 border border-parchment-300 rounded px-1.5 py-0.5 shrink-0">
                  {task.repeat_type === 'daily' ? '↻ Daily' :
                   task.repeat_type === 'weekly' ? '↻ Weekly' : '↻ Custom'}
                </span>
              )}
            </div>

            {/* Description */}
            <AnimatePresence>
              {expanded && task.description && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="font-body text-xs text-ink-500 italic mt-1.5 leading-relaxed"
                >
                  {task.description}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Expanded actions — hidden for completed tasks */}
        <AnimatePresence>
          {expanded && !completedToday && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 mt-3 pt-3 border-t border-parchment-200 overflow-hidden"
            >
              <Button size="sm" variant="secondary" onClick={() => onEdit(task)} className="flex-1">
                Edit
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(task.id)} className="flex-1">
                Delete
              </Button>
            </motion.div>
          )}
          {expanded && completedToday && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-parchment-200 overflow-hidden"
            >
              <p className="font-body text-xs text-ink-400 italic text-center">
                ✓ Completed today — cannot be edited
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* XP flash overlay */}
      <AnimatePresence>
        {showXp && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 right-2 bg-sea-600 text-white font-mono text-xs font-bold px-2 py-1 rounded shadow-lg pointer-events-none"
          >
            +{tier.baseXp} XP
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}