import { Badge } from '@/components/ui/badge'
import { SEVERITY_TERMS } from '@/lib/authguard/glossary'
import type { AlertSeverity } from '@/lib/detection/types'
import { cn } from '@/lib/utils'
import { Explain } from './explain'

const STYLES: Record<AlertSeverity, string> = {
  high: 'border-destructive/50 bg-destructive/15 text-destructive',
  medium: 'border-warning/50 bg-warning/15 text-warning',
  low: 'border-primary/40 bg-primary/10 text-primary',
}

/** The severity label; hovering or tapping it explains what the level means. */
export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <Explain term={SEVERITY_TERMS[severity]} plain>
      <Badge variant="outline" className={cn('font-mono uppercase', STYLES[severity])}>
        {severity}
      </Badge>
    </Explain>
  )
}
