import { Avatar, Checkbox } from '../../components/ui'
import { IconRepeat } from '../../components/icons'
import { recurrenceLabel } from '../../lib/taskSeries'
import type { MemberProfile, Task, TaskSeries } from '../../types'

function firstName(profile: MemberProfile | null): string {
  return profile?.name.split(' ')[0] ?? 'Alguien'
}

/**
 * Fila de una tarea del día: check a la izquierda (completar/desmarcar),
 * texto tocable (abre edición) y los puntos a la derecha.
 */
export default function TaskRow({
  task,
  series,
  profiles,
  onToggle,
  onEdit,
}: {
  task: Task
  /** Serie a la que pertenece, si es una tarea repetida */
  series: TaskSeries | null
  profiles: Record<string, MemberProfile>
  onToggle: (task: Task) => void
  onEdit: (task: Task) => void
}) {
  const assignee = profiles[task.assigneeUid] ?? null
  const completer = task.completedBy ? (profiles[task.completedBy] ?? null) : null

  return (
    <div
      className={`flex min-h-13 w-full items-center gap-1 border-b border-line py-1 pr-4 pl-1 last:border-b-0 ${
        task.done ? 'opacity-55' : ''
      }`}
    >
      <Checkbox
        checked={task.done}
        onChange={() => onToggle(task)}
        label={task.done ? `Desmarcar ${task.title}` : `Marcar ${task.title} como hecha`}
      />
      <button
        type="button"
        onClick={() => onEdit(task)}
        className="min-w-0 flex-1 py-1.5 text-left"
      >
        <span className={`block truncate font-medium ${task.done ? 'line-through' : ''}`}>
          {task.title}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink2">
          {task.done ? (
            <span className="truncate">Hecha por {firstName(completer)}</span>
          ) : (
            <>
              <Avatar profile={assignee} size={16} />
              <span className="truncate">{firstName(assignee)}</span>
              {series && (
                <>
                  <span aria-hidden="true">·</span>
                  <IconRepeat size={13} className="shrink-0" />
                  <span className="truncate">{recurrenceLabel(series.recurrence)}</span>
                </>
              )}
            </>
          )}
        </span>
      </button>
      {task.points > 0 && (
        <span className="shrink-0 pl-2 font-semibold text-accent tabular">+{task.points}</span>
      )}
    </div>
  )
}
