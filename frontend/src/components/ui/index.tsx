import { forwardRef } from 'react'
import clsx from 'clsx'

// ---- Button ----
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'sea'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-heading font-medium uppercase tracking-wider',
          'transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
          'border focus:outline-none focus:ring-2 focus:ring-offset-1',
          {
            // Sizes
            'text-xs px-3 py-1.5 rounded':    size === 'sm',
            'text-sm px-4 py-2 rounded':      size === 'md',
            'text-base px-6 py-3 rounded-md': size === 'lg',
            // Variants
            'bg-ink-900 text-parchment-50 border-ink-900 hover:bg-ink-800 focus:ring-ink-400 shadow-wanted':
              variant === 'primary',
            'bg-parchment-100 text-ink-800 border-parchment-400 hover:bg-parchment-200 focus:ring-parchment-400 shadow-parchment':
              variant === 'secondary',
            'bg-transparent text-ink-600 border-transparent hover:bg-parchment-200 focus:ring-parchment-300':
              variant === 'ghost',
            'bg-wanted-600 text-white border-wanted-700 hover:bg-wanted-700 focus:ring-wanted-300 shadow-wanted':
              variant === 'danger',
            'bg-sea-600 text-white border-sea-700 hover:bg-sea-700 focus:ring-sea-300 shadow-parchment':
              variant === 'sea',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ---- Card ----
interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={clsx('card-parchment p-4', onClick && 'cursor-pointer hover:shadow-parchment-lg transition-shadow', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ---- Input ----
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="font-heading text-xs uppercase tracking-wider text-ink-600">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded',
            'font-body text-ink-900 placeholder-ink-400',
            'focus:outline-none focus:ring-2 focus:ring-sea-400 focus:border-sea-400',
            'shadow-inset-parchment transition-colors',
            error && 'border-wanted-500 focus:ring-wanted-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-wanted-600 font-body">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ---- Textarea ----
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="font-heading text-xs uppercase tracking-wider text-ink-600">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded',
            'font-body text-ink-900 placeholder-ink-400 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-sea-400 focus:border-sea-400',
            'shadow-inset-parchment transition-colors',
            error && 'border-wanted-500 focus:ring-wanted-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-wanted-600 font-body">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ---- Progress Bar ----
interface ProgressBarProps {
  value: number    // 0–100
  max?: number
  label?: string
  showPct?: boolean
  color?: 'sea' | 'wanted' | 'gold'
}

export function ProgressBar({ value, max = 100, label, showPct = false, color = 'sea' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))

  const fillClass = {
    sea:    'from-sea-500 to-sea-400',
    wanted: 'from-wanted-500 to-wanted-400',
    gold:   'from-parchment-500 to-parchment-400',
  }[color]

  return (
    <div className="flex flex-col gap-1">
      {(label || showPct) && (
        <div className="flex justify-between items-center">
          {label && <span className="font-heading text-xs uppercase tracking-wider text-ink-600">{label}</span>}
          {showPct && <span className="font-mono text-xs text-ink-500">{pct}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div
          className={clsx('progress-fill bg-gradient-to-r', fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ---- Stat Badge ----
interface StatBadgeProps {
  icon: string
  label: string
  value: string | number
  sub?: string
}

export function StatBadge({ icon, label, value, sub }: StatBadgeProps) {
  return (
    <div className="flex items-center gap-2 bg-parchment-100 border border-parchment-300 rounded px-3 py-2">
      <span className="text-lg">{icon}</span>
      <div className="flex flex-col">
        <span className="font-heading text-xs uppercase tracking-wide text-ink-500">{label}</span>
        <span className="font-heading font-bold text-ink-900 leading-tight">
          {value}
          {sub && <span className="font-normal text-ink-500 text-xs ml-1">{sub}</span>}
        </span>
      </div>
    </div>
  )
}

// ---- Divider ----
export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-parchment-300 my-4" />
  return (
    <div className="section-header my-4 text-xs">
      {label}
    </div>
  )
}

// ---- Loading spinner ----
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <svg
      className={clsx('animate-spin text-sea-500', {
        'h-4 w-4': size === 'sm',
        'h-6 w-6': size === 'md',
        'h-10 w-10': size === 'lg',
      })}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}