import { Badge } from '@/components/ui/badge'
import type { AlertSeverity } from '@/lib/detection/types'
import { cn } from '@/lib/utils'

const STYLES: Record<AlertSeverity, string> = {
  high: 'border-destructive/50 bg-destructive/15 text-destructive',
  medium: 'border-warning/50 bg-warning/15 text-warning',
  low: 'border-primary/40 bg-primary/10 text-primary',
}

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <Badge variant="outline" className={cn('font-mono uppercase', STYLES[severity])}>
      {severity}
    </Badge>
  )
}
