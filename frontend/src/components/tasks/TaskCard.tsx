import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { DIFFICULTY_TIERS, TASK_TYPES } from '@/types'
import type { Task, XpResult } from '@/types'
import { Button } from '@/components/ui'

interface TaskCardProps {
  task: Task
  completedToday?: boolean
  onComplete: (task: Task) => Promise<XpResult | null>
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

export function TaskCard({ task, completedToday, onComplete, onEdit, onDelete }: TaskCardProps) {
  const [completing, setCompleting]   = useState(false)
  const [xpResult, setXpResult]       = useState<XpResult | null>(null)
  const [showPop, setShowPop]         = useState(false)
  const [justCompleted, setJustDone]  = useState(false)
  const [expanded, setExpanded]       = useState(false)

  const tier       = DIFFICULTY_TIERS.find(t => t.level === task.difficulty)!
  const typeConfig = TASK_TYPES.find(t => t.key === task.task_type)!

  async function handleComplete() {
    if (completedToday || completing) return
    setCompleting(true)
    try {
      const result = await onComplete(task)
      if (result) {
        setXpResult(result)
        setJustDone(true)
        setShowPop(true)
        setTimeout(() => setShowPop(false), 2200)
        setTimeout(() => setJustDone(false), 600)
      }
    } catch (e) {
      console.error('handleComplete error:', e)
    } finally {
      setCompleting(false)
    }
  }

  const earnedXp = xpResult?.xpEarned ?? tier.baseXp
  const isOverBudget = xpResult ? !xpResult.countedForParty : false

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={clsx(
        'card-parchment overflow-visible relative',
        completedToday && 'opacity-70'
      )}
    >
      {/* Card flash on completion */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-sea-200 rounded pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      <div className="p-3 relative z-10">
        <div className="flex items-start gap-3">

          {/* Complete button with burst */}
          <div className="relative mt-0.5 shrink-0">
            <button
              onClick={handleComplete}
              disabled={completedToday || completing}
              className={clsx(
                'w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200',
                completedToday
                  ? 'bg-sea-500 border-sea-600 text-white scale-110'
                  : 'border-parchment-400 hover:border-sea-400 hover:bg-sea-50 active:scale-90'
              )}
            >
              {completing ? (
                <svg className="animate-spin h-3 w-3 text-sea-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : completedToday ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="text-xs"
                >
                  ✓
                </motion.span>
              ) : null}
            </button>

            {/* Burst rings on completion */}
            <AnimatePresence>
              {justCompleted && (
                <>
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.5, opacity: 0.8 }}
                      animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
                      exit={{}}
                      transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full border-2 border-sea-400 pointer-events-none"
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>

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

                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="task-badge text-[9px] bg-parchment-200 text-ink-600 border border-parchment-300">
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

              {task.repeat_type !== 'none' && (
                <span className="font-heading text-[9px] uppercase tracking-wide text-parchment-600 bg-parchment-200 border border-parchment-300 rounded px-1.5 py-0.5 shrink-0">
                  {task.repeat_type === 'daily' ? '↻ Daily' :
                   task.repeat_type === 'weekly' ? '↻ Weekly' : '↻ Custom'}
                </span>
              )}
            </div>

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

        {/* Expanded actions */}
        <AnimatePresence>
          {expanded && !completedToday && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 mt-3 pt-3 border-t border-parchment-200 overflow-hidden"
            >
              <Button size="sm" variant="secondary" onClick={() => onEdit(task)} className="flex-1">Edit</Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(task.id)} className="flex-1">Delete</Button>
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

      {/* ---- Floating XP pop ---- */}
      <AnimatePresence>
        {showPop && (
          <motion.div
            initial={{ opacity: 1, y: 0, x: '-50%' }}
            animate={{ opacity: 0, y: -52, x: '-50%' }}
            exit={{}}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-0 pointer-events-none z-50 flex flex-col items-center gap-0.5"
          >
            {/* Main XP number */}
            <div className={clsx(
              'font-heading font-bold text-base px-3 py-1 rounded-full shadow-lg',
              isOverBudget
                ? 'bg-parchment-400 text-ink-700'
                : 'bg-sea-500 text-white'
            )}>
              +{earnedXp} XP
            </div>

            {/* Stat sub-labels */}
            {xpResult && (xpResult.powerEarned > 0 || xpResult.bountyEarned > 0) && (
              <div className="flex gap-1.5">
                {xpResult.powerEarned > 0 && (
                  <span className="font-heading text-[10px] bg-wanted-100 text-wanted-700 border border-wanted-200 rounded-full px-2 py-0.5">
                    ⚡+{xpResult.powerEarned}
                  </span>
                )}
                {xpResult.bountyEarned > 0 && (
                  <span className="font-heading text-[10px] bg-parchment-200 text-ink-700 border border-parchment-400 rounded-full px-2 py-0.5">
                    💰+{xpResult.bountyEarned}
                  </span>
                )}
              </div>
            )}

            {/* Over budget note */}
            {isOverBudget && (
              <span className="font-body text-[10px] text-ink-500 italic">
                personal reserve
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}