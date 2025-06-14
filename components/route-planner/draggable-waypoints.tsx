"use client"

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GripVertical, X, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DraggableWaypointsProps {
  waypoints: string[]
  onWaypointsChange: (waypoints: string[]) => void
  onRemoveWaypoint: (index: number) => void
  className?: string
}

interface WaypointItemProps {
  waypoint: string
  index: number
  totalCount: number
  onRemove: (index: number) => void
  isDragging?: boolean
}

function WaypointItem({ waypoint, index, totalCount, onRemove, isDragging = false }: WaypointItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: `waypoint-${index}`,
    disabled: index === 0 || index === totalCount - 1 // Disable dragging for start and end points
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isStart = index === 0
  const isEnd = index === totalCount - 1
  const isDraggable = !isStart && !isEnd
  const isBeingDragged = isDragging || isSortableDragging

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 bg-black/20 rounded-lg border border-white/10 transition-all duration-200",
        isBeingDragged && "opacity-50 scale-105 shadow-lg border-[#EF2D56]/50",
        isDraggable && "hover:bg-black/30 cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Drag Handle */}
      {isDraggable && (
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      {/* Waypoint Number and Badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
          isStart && "bg-green-500 text-white",
          isEnd && "bg-red-500 text-white",
          !isStart && !isEnd && "bg-[#EF2D56] text-white"
        )}>
          {index + 1}
        </div>

        {/* Badge */}
        {isStart && <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">Start</Badge>}
        {isEnd && <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">End</Badge>}
        {!isStart && !isEnd && <Badge variant="secondary" className="text-xs bg-[#EF2D56]/20 text-[#EF2D56]">Stop</Badge>}

        {/* Address */}
        <span className="text-sm text-white truncate flex-1">
          {waypoint || 'Enter address...'}
        </span>
      </div>

      {/* Remove Button - Only for intermediate waypoints */}
      {isDraggable && (
        <Button
          onClick={() => onRemove(index)}
          variant="outline"
          size="sm"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 shrink-0 w-8 h-8 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Fixed indicator for start/end */}
      {!isDraggable && (
        <div className="w-6 h-6 flex items-center justify-center">
          <MapPin className={cn(
            "h-4 w-4",
            isStart && "text-green-400",
            isEnd && "text-red-400"
          )} />
        </div>
      )}
    </div>
  )
}

export function DraggableWaypoints({ 
  waypoints, 
  onWaypointsChange, 
  onRemoveWaypoint,
  className = "" 
}: DraggableWaypointsProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [draggedWaypoint, setDraggedWaypoint] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    // Extract index from the active id
    const draggedIndex = parseInt((active.id as string).split('-')[1])
    setDraggedWaypoint(waypoints[draggedIndex])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setDraggedWaypoint(null)
      return
    }

    if (active.id !== over.id) {
      const activeIndex = parseInt((active.id as string).split('-')[1])
      const overIndex = parseInt((over.id as string).split('-')[1])

      // Prevent moving start (0) or end (length-1) waypoints
      if (activeIndex === 0 || activeIndex === waypoints.length - 1 ||
          overIndex === 0 || overIndex === waypoints.length - 1) {
        setActiveId(null)
        setDraggedWaypoint(null)
        return
      }

      const newWaypoints = arrayMove(waypoints, activeIndex, overIndex)
      onWaypointsChange(newWaypoints)
    }

    setActiveId(null)
    setDraggedWaypoint(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setDraggedWaypoint(null)
  }

  // Create items array for sortable context
  const items = waypoints.map((_, index) => `waypoint-${index}`)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white">Route Stops</h4>
        <div className="text-xs text-gray-400">
          Drag to reorder stops
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {waypoints.map((waypoint, index) => (
              <WaypointItem
                key={`waypoint-${index}`}
                waypoint={waypoint}
                index={index}
                totalCount={waypoints.length}
                onRemove={onRemoveWaypoint}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && draggedWaypoint ? (
            <div className="flex items-center gap-2 p-3 bg-black/40 backdrop-blur-md rounded-lg border border-[#EF2D56]/50 shadow-2xl">
              <div className="flex items-center justify-center w-6 h-6 text-gray-400">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 bg-[#EF2D56] text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  •
                </div>
                <Badge variant="secondary" className="text-xs bg-[#EF2D56]/20 text-[#EF2D56]">Stop</Badge>
                <span className="text-sm text-white truncate flex-1">
                  {draggedWaypoint}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Instructions */}
      <div className="text-xs text-gray-400 bg-black/10 p-2 rounded border border-white/5">
        <p className="flex items-center gap-1">
          <GripVertical className="h-3 w-3" />
          <strong>Drag handles</strong> to reorder intermediate stops
        </p>
        <p className="mt-1 text-gray-500">Start and end points are fixed</p>
      </div>
    </div>
  )
} 