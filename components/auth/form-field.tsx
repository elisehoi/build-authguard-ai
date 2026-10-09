import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type FormFieldProps = React.ComponentProps<typeof Input> & {
  name: string
  label: string
  error?: string
  hint?: string
}

export function FormField({ name, label, error, hint, ...inputProps }: FormFieldProps) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
      {error ? (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
