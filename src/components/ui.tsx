import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from 'react'
import { IconPlus } from './icons'
import type { MemberProfile } from '../types'

// ---------- PageHeader ----------

export function PageHeader({
  title,
  right,
  subtitle,
}: {
  title: string
  right?: ReactNode
  subtitle?: string
}) {
  return (
    <header className="pt-safe sticky top-0 z-10 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="flex items-end justify-between px-4 pt-3 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-ink2">{subtitle}</p>}
        </div>
        {right && <div className="pb-0.5">{right}</div>}
      </div>
    </header>
  )
}

// ---------- Sheet (bottom sheet modal) ----------

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-2xl border-0 bg-card p-0 text-ink shadow-2xl backdrop:bg-black/45"
    >
      <div className="mx-auto max-w-lg px-4 pt-3 pb-safe">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-2 text-ink2"
          >
            Cerrar
          </button>
        </div>
        <div className="pb-6">{children}</div>
      </div>
    </dialog>
  )
}

// ---------- Form helpers ----------

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-medium text-ink2">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full min-h-11 rounded-xl border border-line bg-card2 px-3 py-2 text-ink placeholder:text-ink2/70 focus:border-accent focus:outline-none'

export function SubmitButton({
  children,
  disabled,
}: {
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-1 min-h-12 w-full rounded-xl bg-accent font-semibold text-white active:opacity-80 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function FormSheet({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel,
  canSubmit = true,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  onSubmit: () => Promise<void> | void
  submitLabel: string
  canSubmit?: boolean
  children: ReactNode
}) {
  const [busy, setBusy] = useState(false)
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await onSubmit()
      onClose()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Algo salió mal. Probá de nuevo.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        {children}
        <SubmitButton disabled={!canSubmit || busy}>
          {busy ? 'Guardando…' : submitLabel}
        </SubmitButton>
      </form>
    </Sheet>
  )
}

// ---------- SegmentedControl ----------

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-xl bg-card2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`min-h-10 flex-1 rounded-lg text-sm font-medium transition-colors ${
            value === o.value ? 'bg-card text-ink shadow-sm' : 'text-ink2'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ---------- Chips ----------

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium ${
        selected
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line bg-card text-ink2'
      }`}
    >
      {children}
    </button>
  )
}

// ---------- Avatar ----------

export function Avatar({
  profile,
  size = 32,
}: {
  profile: MemberProfile | null
  size?: number
}) {
  const initial = profile?.name?.[0]?.toUpperCase() ?? '?'
  if (profile?.photoURL) {
    return (
      <img
        src={profile.photoURL}
        alt={profile.name}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-accent-soft font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  )
}

// ---------- MemberPicker ("¿Quién?") ----------

export function MemberPicker({
  members,
  value,
  onChange,
}: {
  members: Array<{ uid: string; profile: MemberProfile }>
  value: string
  onChange: (uid: string) => void
}) {
  return (
    <div className="flex gap-2">
      {members.map(({ uid, profile }) => (
        <button
          key={uid}
          type="button"
          onClick={() => onChange(uid)}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border px-3 font-medium ${
            value === uid
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-line bg-card2 text-ink2'
          }`}
        >
          <Avatar profile={profile} size={24} />
          <span className="truncate">{profile.name.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  )
}

// ---------- FAB ----------

export function FAB({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg active:scale-95"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.7rem)' }}
    >
      <IconPlus size={26} />
    </button>
  )
}

// ---------- EmptyState ----------

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: ReactNode
  title: string
  hint: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-14 text-center text-ink2">
      <div className="opacity-60">{icon}</div>
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-sm">{hint}</p>
    </div>
  )
}

// ---------- ConfirmDialog (confirm nativo con estilo propio simple) ----------

export function useConfirm() {
  return (message: string) => window.confirm(message)
}

// ---------- ListRow ----------

export function ListRow({
  onClick,
  left,
  right,
  title,
  subtitle,
  dimmed,
}: {
  onClick?: () => void
  left?: ReactNode
  right?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  dimmed?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex min-h-13 w-full items-center gap-3 border-b border-line bg-card px-4 py-2.5 text-left last:border-b-0 ${
        dimmed ? 'opacity-55' : ''
      }`}
    >
      {left}
      <div className="min-w-0 flex-1">
        <div className={`truncate font-medium ${dimmed ? 'line-through' : ''}`}>
          {title}
        </div>
        {subtitle && <div className="truncate text-sm text-ink2">{subtitle}</div>}
      </div>
      {right}
    </Tag>
  )
}

/** Contenedor de lista con bordes redondeados estilo iOS grouped */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-card shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-6 mb-2 px-1 text-sm font-semibold tracking-wide text-ink2 uppercase">
      {children}
    </h2>
  )
}
