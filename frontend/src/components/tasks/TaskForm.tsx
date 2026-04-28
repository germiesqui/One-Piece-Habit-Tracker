import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Input, Textarea } from '@/components/ui'
import { DIFFICULTY_TIERS, TASK_TYPES } from '@/types'
import type { Task, TaskFormData, TaskType, RepeatType } from '@/types'
import clsx from 'clsx'
 
interface TaskFormProps {
  initialData?: Task
  onSubmit: (data: TaskFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}
 
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
 
export function TaskForm({ initialData, onSubmit, onCancel, loading }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [taskType, setTaskType] = useState<TaskType>(initialData?.task_type ?? 'study')
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? 3)
  const [repeatType, setRepeatType] = useState<RepeatType>(initialData?.repeat_type ?? 'none')
  const [repeatDays, setRepeatDays] = useState<number[]>(initialData?.repeat_days ?? [])
 
  const selectedTier = DIFFICULTY_TIERS.find(t => t.level === difficulty)!
 
  function toggleDay(day: number) {
    setRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({ title, description, task_type: taskType, difficulty, repeat_type: repeatType, repeat_days: repeatDays })
  }
 
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
 
      {/* Title */}
      <Input
        label="Mission Title"
        placeholder="e.g. 30 minutes of Anki"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
 
      {/* Description */}
      <Textarea
        label="Description (optional)"
        placeholder="Any notes about this mission..."
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
      />
 
      {/* Task Type */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-xs uppercase tracking-wider text-ink-600">Mission Type</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TASK_TYPES.map(type => (
            <button
              key={type.key}
              type="button"
              onClick={() => setTaskType(type.key)}
              className={clsx(
                'flex flex-col items-center gap-1 p-2 rounded border text-center transition-all',
                taskType === type.key
                  ? 'bg-ink-900 text-parchment-50 border-ink-900'
                  : 'bg-parchment-50 text-ink-700 border-parchment-300 hover:border-ink-400'
              )}
            >
              <span className="text-lg">{type.emoji}</span>
              <span className="font-heading text-[10px] uppercase tracking-wide leading-tight">{type.label}</span>
              <span className={clsx(
                'font-heading text-[9px] uppercase tracking-wide',
                taskType === type.key ? 'text-parchment-300' : 'text-ink-400'
              )}>
                {type.primaryStat === 'power' ? '⚡ Power' : type.primaryStat === 'bounty' ? '💰 Bounty' : '⚡💰 Both'}
              </span>
            </button>
          ))}
        </div>
      </div>
 
      {/* Difficulty Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="font-heading text-xs uppercase tracking-wider text-ink-600">Difficulty</label>
          <div className="flex items-center gap-1.5">
            <span className="text-base">{selectedTier.emoji}</span>
            <span className="font-heading text-sm font-semibold text-ink-900">{selectedTier.name}</span>
            <span className="font-body text-xs text-ink-500">· {selectedTier.label}</span>
            <span className="font-mono text-xs text-sea-700 ml-1">+{selectedTier.baseXp} XP</span>
          </div>
        </div>
 
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={difficulty}
          onChange={e => setDifficulty(Number(e.target.value))}
          className="w-full accent-ink-900 cursor-pointer"
        />
 
        {/* Tier labels */}
        <div className="flex justify-between">
          {DIFFICULTY_TIERS.map(tier => (
            <span key={tier.level} className={clsx(
              'font-heading text-[9px] uppercase tracking-wide text-center',
              difficulty === tier.level ? 'text-ink-900 font-bold' : 'text-ink-400'
            )}>
              {tier.label}
            </span>
          ))}
        </div>
      </div>
 
      {/* Repeat */}
      <div className="flex flex-col gap-2">
        <label className="font-heading text-xs uppercase tracking-wider text-ink-600">Schedule</label>
        <div className="flex gap-2">
          {(['none', 'daily', 'weekly', 'custom'] as RepeatType[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRepeatType(r)}
              className={clsx(
                'flex-1 py-1.5 rounded border font-heading text-[10px] uppercase tracking-wide transition-all',
                repeatType === r
                  ? 'bg-ink-900 text-parchment-50 border-ink-900'
                  : 'bg-parchment-50 text-ink-600 border-parchment-300 hover:border-ink-400'
              )}
            >
              {r === 'none' ? 'Once' : r}
            </button>
          ))}
        </div>
 
        <AnimatePresence>
          {repeatType === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-1.5 overflow-hidden"
            >
              {DAYS.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={clsx(
                    'flex-1 py-1.5 rounded border font-heading text-[10px] uppercase transition-all',
                    repeatDays.includes(i)
                      ? 'bg-sea-600 text-white border-sea-700'
                      : 'bg-parchment-50 text-ink-600 border-parchment-300'
                  )}
                >
                  {day}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
 
      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {initialData ? 'Save Changes' : 'Create Mission'}
        </Button>
      </div>
    </form>
  )
}