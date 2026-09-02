import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
  type InputHTMLAttributes,
} from 'react'
import { IconCheck, IconChevronLeft, IconPlus } from './icons'
import type { MemberProfile } from '../types'

// ---------- PageHeader ----------

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  right,
  onBack,
}: {
  title: string
  eyebrow?: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
}) {
  return (
    <header className="pt-safe sticky top-0 z-10 bg-bg/92 backdrop-blur-md">
      <div className="flex items-end justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex min-w-0 items-end gap-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Volver"
              className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand dark:text-accent"
            >
              <IconChevronLeft size={24} />
            </button>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-0.5 text-[11.5px] font-semibold tracking-[0.08em] text-ink2 uppercase">
                {eyebrow}
              </p>
            )}
            <h1 className="truncate text-[26px] leading-tight font-extrabold">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-ink2">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="shrink-0 pb-0.5">{right}</div>}
      </div>
    </header>
  )
}

// ---------- Botones ----------

export function IconButton({
  label,
  onClick,
  children,
  tone = 'neutral',
}: {
  label: string
  onClick?: () => void
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'danger'
}) {
  const tones = {
    neutral: 'bg-card text-ink2 shadow-[0_1px_2px_rgb(20_33_61/0.06)]',
    brand: 'bg-brand-soft text-brand dark:text-accent',
    danger: 'text-ink2 hover:text-danger',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${tones[tone]}`}
    >
      {children}
    </button>
  )
}

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
      className="mt-2 min-h-12 w-full rounded-xl bg-brand font-display text-[15px] font-bold text-on-brand transition-opacity duration-150 active:opacity-80 disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  onClick,
  tone = 'brand',
}: {
  children: ReactNode
  onClick: () => void
  tone?: 'brand' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-2 min-h-11 w-full rounded-xl font-semibold ${
        tone === 'danger' ? 'text-danger' : 'text-brand dark:text-accent'
      }`}
    >
      {children}
    </button>
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
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none rounded-t-3xl border-0 bg-card p-0 text-ink shadow-2xl"
    >
      <div className="mx-auto max-w-lg px-5 pt-3 pb-safe">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-2 text-sm font-semibold text-ink2"
          >
            Cerrar
          </button>
        </div>
        <div className="max-h-[70dvh] overflow-y-auto pb-6">{children}</div>
      </div>
    </dialog>
  )
}

// ---------- Form helpers ----------

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink2">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full min-h-12 rounded-xl border border-line bg-card2 px-3.5 py-2 text-ink placeholder:text-ink2/60 focus:border-accent focus:bg-card focus:outline-none transition-colors duration-150'

/** Input de monto con el signo $ adentro del rectángulo. Guarda enteros. */
export function MoneyInput({
  value,
  onChange,
  ...rest
}: {
  value: string
  onChange: (digits: string) => void
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-display text-lg font-bold text-ink2">
        $
      </span>
      <input
        {...rest}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        className={`${inputClass} tabular pl-8 font-display text-lg font-bold`}
      />
    </div>
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
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  onSubmit: () => Promise<void> | void
  submitLabel: string
  canSubmit?: boolean
  children: ReactNode
  /** Acciones secundarias debajo del botón principal (p.ej. eliminar) */
  footer?: ReactNode
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
        {footer}
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
          aria-pressed={value === o.value}
          className={`min-h-10 flex-1 rounded-lg text-sm font-semibold transition-colors duration-150 ${
            value === o.value
              ? 'bg-card text-brand shadow-[0_1px_2px_rgb(20_33_61/0.08)] dark:text-accent'
              : 'text-ink2'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Conmutador compacto de dos estados (p.ej. Hay / Comprar) */
export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  activeTone = 'brand',
}: {
  options: [{ value: T; label: string }, { value: T; label: string }]
  value: T
  onChange: (v: T) => void
  activeTone?: 'brand' | 'warn'
}) {
  return (
    <div className="flex shrink-0 rounded-full bg-card2 p-0.5" role="group">
      {options.map((o) => {
        const on = value === o.value
        const tone =
          activeTone === 'warn' && o.value === options[1].value
            ? 'bg-warn-soft text-warn'
            : 'bg-brand text-on-brand'
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`min-h-8 rounded-full px-3 text-xs font-semibold transition-colors duration-150 ${
              on ? tone : 'text-ink2'
            }`}
          >
            {o.label}
          </button>
        )
      })}
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
      aria-pressed={selected}
      className={`min-h-9 shrink-0 rounded-full border px-3 text-sm font-semibold transition-colors duration-150 ${
        selected
          ? 'border-brand bg-brand-soft text-brand dark:border-accent dark:text-accent'
          : 'border-line bg-card text-ink2'
      }`}
    >
      {children}
    </button>
  )
}

// ---------- Checkbox circular ----------

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span
        className={`flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 transition-colors duration-150 ${
          checked ? 'border-brand bg-brand text-on-brand' : 'border-ink2/45 bg-transparent'
        }`}
      >
        {checked && <IconCheck size={16} strokeWidth={3} />}
      </span>
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
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-display font-bold text-on-brand"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
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
          aria-pressed={value === uid}
          onClick={() => onChange(uid)}
          className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-3 font-semibold transition-colors duration-150 ${
            value === uid
              ? 'border-brand bg-brand-soft text-brand dark:border-accent dark:text-accent'
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
      className="fixed right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-on-brand shadow-[0_8px_20px_-6px_rgb(27_47_91/0.55)] transition-transform duration-150 active:scale-95"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.9rem)' }}
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
    <div className="flex flex-col items-center gap-2 px-8 py-12 text-center">
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand dark:text-accent">
        {icon}
      </div>
      <p className="font-display font-bold text-ink">{title}</p>
      <p className="text-sm text-ink2">{hint}</p>
    </div>
  )
}

// ---------- ConfirmDialog (confirm nativo) ----------

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
      className={`flex min-h-13 w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left last:border-b-0 ${
        dimmed ? 'opacity-55' : ''
      }`}
    >
      {left}
      <div className="min-w-0 flex-1">
        <div className={`truncate font-medium ${dimmed ? 'line-through' : ''}`}>
          {title}
        </div>
        {subtitle && <div className="truncate text-[13px] text-ink2">{subtitle}</div>}
      </div>
      {right}
    </Tag>
  )
}

/** Tarjeta blanca con sombra suave */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgb(20_33_61/0.05)] ${className}`}
    >
      {children}
    </div>
  )
}

/** Título de sección con contador/acción opcional a la derecha */
export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mt-6 mb-2 flex items-baseline justify-between px-1">
      <h2 className="text-[15px] font-bold">{children}</h2>
      {right && <span className="text-xs font-semibold text-ink2">{right}</span>}
    </div>
  )
}

/** Botón ancho de menú con ícono (Nosotros / Configuración) */
export function MenuButton({
  icon,
  title,
  subtitle,
  onClick,
  right,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  onClick: () => void
  right?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] w-full items-center gap-4 rounded-2xl bg-card px-4 text-left shadow-[0_1px_2px_rgb(20_33_61/0.05)] transition-transform duration-150 active:scale-[0.99]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand dark:text-accent">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[16px] font-bold">{title}</span>
        {subtitle && <span className="block truncate text-[13px] text-ink2">{subtitle}</span>}
      </span>
      {right}
    </button>
  )
}
