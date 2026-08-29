import { Avatar, ListRow } from '../../components/ui'
import { IconTrash } from '../../components/icons'
import { formatShort, toISO } from '../../lib/dates'
import type { MemberProfile, Task } from '../../types'

export default function TaskRow({
  task,
  profiles,
  onToggle,
  onDelete,
}: {
  task: Task
  profiles: Record<string, MemberProfile>
  onToggle: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const assignee = profiles[task.assigneeUid] ?? null
  const completer = task.completedBy ? (profiles[task.completedBy] ?? null) : null

  const subtitle = task.done ? (
    <span className="flex items-center gap-1.5">
      <Avatar profile={completer} size={16} />
      <span className="truncate">
        {completer?.name.split(' ')[0] ?? 'Alguien'}
        {task.completedAt ? ` · ${formatShort(toISO(task.completedAt.toDate()))}` : ''}
        {' · '}
        <span className="text-gold">+{task.points} pts</span>
      </span>
    </span>
  ) : (
    <span className="flex items-center gap-1.5">
      <Avatar profile={assignee} size={16} />
      <span className="truncate">
        {assignee?.name.split(' ')[0] ?? 'Alguien'} ·{' '}
        <span className="text-gold">+{task.points} pts</span>
      </span>
    </span>
  )

  return (
    <ListRow
      dimmed={task.done}
      left={
        <button
          type="button"
          onClick={() => onToggle(task)}
          aria-label={task.done ? 'Desmarcar tarea' : 'Marcar como hecha'}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            task.done ? 'text-ok' : 'text-ink2'
          }`}
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
              task.done ? 'border-ok bg-ok text-white' : 'border-line bg-card2'
            }`}
          >
            {task.done && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 5 5 9-11" />
              </svg>
            )}
          </span>
        </button>
      }
      title={task.title}
      subtitle={subtitle}
      right={
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label="Borrar tarea"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-ink2 active:text-danger"
        >
          <IconTrash size={19} />
        </button>
      }
    />
  )
}
