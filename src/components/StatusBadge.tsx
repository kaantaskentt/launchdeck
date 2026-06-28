import { AlertTriangle, CheckCircle2, CircleDashed } from 'lucide-react'
import type { ProjectHealth, SecurityState } from '../types'

type StatusBadgeProps = {
  state: ProjectHealth | SecurityState
  label: string
}

export function StatusBadge({ state, label }: StatusBadgeProps) {
  const Icon =
    state === 'healthy' || state === 'pass'
      ? CheckCircle2
      : state === 'degraded' || state === 'warn'
        ? AlertTriangle
        : CircleDashed

  return (
    <span className={`status-badge status-badge--${state}`}>
      <Icon aria-hidden="true" size={14} />
      {label}
    </span>
  )
}
