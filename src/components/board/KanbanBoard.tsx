import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { STATUSES, type JobApplication, type Status } from '../../types'
import { KanbanColumn } from './KanbanColumn'
import { ApplicationCard } from './ApplicationCard'
import { useAppStore } from '../../store/useAppStore'

interface KanbanBoardProps {
  applications: JobApplication[]
  onOpenApplication: (id: string) => void
}

export function KanbanBoard({ applications, onOpenApplication }: KanbanBoardProps) {
  const changeStatus = useAppStore((s) => s.changeStatus)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const byStatus = (status: Status) => applications.filter((a) => a.status === status)
  const activeApp = activeId ? applications.find((a) => a.id === activeId) : undefined

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const app = applications.find((a) => a.id === active.id)
    const newStatus = over.id as Status
    if (app && app.status !== newStatus && STATUSES.includes(newStatus)) {
      changeStatus(app.id, newStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="scrollbar-thin flex h-full gap-3 overflow-x-auto px-lg py-md">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={byStatus(status)}
            onOpenApplication={onOpenApplication}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApp ? <ApplicationCard app={activeApp} onOpen={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
