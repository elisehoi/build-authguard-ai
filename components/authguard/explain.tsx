'use client'

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY, type GlossaryTerm } from '@/lib/authguard/glossary'
import { cn } from '@/lib/utils'

const WIDTH = 280
const GAP = 6
const CLOSE_DELAY_MS = 120

// Words wrapped in *asterisks* in the glossary are shown in blue.
function Highlighted({ text }: { text: string }) {
  return text.split(/(\*[^*]+\*)/).map((part, index) =>
    part.startsWith('*') && part.endsWith('*') ? (
      <strong key={index} className="font-medium text-[#2563EB]">{part.slice(1, -1)}</strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}

/**
 * A glossary term with a small popover. Opens on hover, on keyboard focus and
 * on click or tap (which pins it open); Escape or a click elsewhere closes it.
 * The popover is portalled to <body>, so table or card overflow never clips it.
 * The trigger sits above stretched card links (relative z-10), so it stays hoverable inside them.
 */
export function Explain({ term, children, plain = false }: { term: GlossaryTerm; children?: React.ReactNode; /** No dotted underline, for triggers that already look like a label. */ plain?: boolean }) {
  const entry = GLOSSARY[term]
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  const show = () => {
    cancelClose()
    setOpen(true)
  }
  const hideSoon = () => {
    if (pinned) return
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }
  const close = useCallback(() => {
    setOpen(false)
    setPinned(false)
  }, [])

  // Below the term, kept inside the viewport; above it when there is no room below.
  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect()
    if (!trigger) return
    const width = Math.min(WIDTH, window.innerWidth - 16)
    const left = Math.min(Math.max(8, trigger.left), window.innerWidth - width - 8)
    const height = popupRef.current?.offsetHeight ?? 0
    const below = trigger.bottom + GAP
    const top = below + height > window.innerHeight - 8 && trigger.top - GAP - height > 8 ? trigger.top - GAP - height : below
    setPosition({ top, left })
  }, [])

  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
        triggerRef.current?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, close, place])

  useEffect(() => cancelClose, [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onFocus={show}
        // Moving focus into the pop-up (to select its text) keeps it open.
        onBlur={(event) => !pinned && !popupRef.current?.contains(event.relatedTarget as Node | null) && setOpen(false)}
        onClick={() => {
          if (pinned) close()
          else {
            setPinned(true)
            show()
          }
        }}
        className={cn(
          "relative z-10 inline cursor-help rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]",
          !plain && "underline decoration-[#2563EB]/50 decoration-dotted underline-offset-4 hover:decoration-[#2563EB]",
        )}
      >
        {children ?? entry.title}
      </button>
      {open &&
        createPortal(
          <div
            ref={popupRef}
            id={id}
            role="tooltip"
            tabIndex={-1}
            onMouseEnter={show}
            onMouseLeave={hideSoon}
            style={{ top: position?.top ?? -9999, left: position?.left ?? -9999, width: Math.min(WIDTH, typeof window === 'undefined' ? WIDTH : window.innerWidth - 16) }}
            className="fixed z-50 flex flex-col gap-1 outline-none rounded-lg border border-[#E2E8F0] bg-white p-3 text-left font-sans text-sm leading-relaxed font-normal text-[#0F172A] normal-case shadow-lg shadow-slate-900/10"
          >
            <span className="font-semibold text-[#2563EB]">{entry.title}</span>
            <span>
              <Highlighted text={entry.body} />
            </span>
          </div>,
          document.body,
        )}
    </>
  )
}
