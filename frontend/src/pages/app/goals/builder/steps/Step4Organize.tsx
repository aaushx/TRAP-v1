import { useBuilderContext } from '../GoalBuilder'
import { Plus, GripVertical, X, FolderKanban, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// --- Sub-components for DnD ---
function SortableTopic({ topic, onRemove }: { topic: any, onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.name })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-bg-surface border border-border-default rounded-lg group">
      <div {...attributes} {...listeners} className="cursor-grab text-text-tertiary hover:text-text-secondary">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{topic.name}</p>
        <p className="text-[10px] text-text-tertiary">{topic.category}</p>
      </div>
      {onRemove && (
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-error transition-all">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function MilestoneContainer({ id, name, topics, onRemoveTopic, onRename, onDelete }: any) {
  const { setNodeRef } = useSortable({ id })
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)

  const handleRename = () => {
    if (editName.trim()) {
      onRename(id, editName)
      setIsEditing(false)
    }
  }

  return (
    <div className="bg-bg-surface border border-border-default rounded-xl p-4 flex flex-col min-h-[460px]">
      <div className="flex items-center justify-between mb-4">
        {isEditing ? (
          <input 
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => e.key === 'Enter' && handleRename()}
            className="bg-bg-base border border-violet-400 rounded px-2 py-1 text-sm text-text-primary outline-none"
          />
        ) : (
          <h3 
            className="font-bold text-text-primary cursor-pointer hover:text-violet-400"
            onClick={() => setIsEditing(true)}
          >
            {name}
          </h3>
        )}
        <button onClick={() => onDelete(id)} className="text-text-tertiary hover:text-error">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <SortableContext id={id} items={topics.map((t: any) => t.name)} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} className="space-y-2 min-h-[100px]">
            {topics.map((topic: any) => (
              <SortableTopic key={topic.name} topic={topic} onRemove={() => onRemoveTopic(id, topic)} />
            ))}
            {topics.length === 0 && (
              <div className="text-center py-8 text-xs text-text-tertiary border-2 border-dashed border-border-default rounded-lg">
                Drag topics here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

// --- Main Step Component ---
export function Step4Organize() {
  const { state, setState, nextStep, prevStep } = useBuilderContext()
  const [activeId, setActiveId] = useState<string | null>(null)

  // Initialize unassigned topics if milestones exist
  const assignedTopicNames = new Set(state.milestones.flatMap(m => m.topics.map((t: any) => t.name)))
  const unassignedTopics = state.selectedTopics.filter(t => !assignedTopicNames.has(t.name))

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const addMilestone = () => {
    const id = `m_${Date.now()}`
    setState(prev => ({
      ...prev,
      milestones: [...prev.milestones, { id, name: `Phase ${prev.milestones.length + 1}`, topics: [] }]
    }))
  }

  const deleteMilestone = (id: string) => {
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
    }))
  }

  const renameMilestone = (id: string, newName: string) => {
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => m.id === id ? { ...m, name: newName } : m)
    }))
  }

  const removeTopicFromMilestone = (milestoneId: string, topic: any) => {
    setState(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => m.id === milestoneId ? { ...m, topics: m.topics.filter((t: any) => t.name !== topic.name) } : m)
    }))
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    // Find containers
    const activeContainer = state.milestones.find(m => m.topics.find((t: any) => t.name === activeId))?.id || 'unassigned'
    const overContainer = state.milestones.find(m => m.id === overId)?.id || state.milestones.find(m => m.topics.find((t: any) => t.name === overId))?.id || 'unassigned'

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setState(prev => {
      const activeItems = activeContainer === 'unassigned' ? unassignedTopics : prev.milestones.find(m => m.id === activeContainer)!.topics
      const overItems = overContainer === 'unassigned' ? unassignedTopics : prev.milestones.find(m => m.id === overContainer)!.topics
      
      const activeIndex = activeItems.findIndex(t => t.name === activeId)
      const overIndex = overItems.findIndex(t => t.name === overId)

      let newIndex = overIndex >= 0 ? overIndex : overItems.length

      const topicToMove = activeItems[activeIndex]

      return {
        ...prev,
        milestones: prev.milestones.map(m => {
          if (m.id === activeContainer) return { ...m, topics: m.topics.filter((t: any) => t.name !== activeId) }
          if (m.id === overContainer) {
            const newTopics = [...m.topics]
            newTopics.splice(newIndex, 0, topicToMove)
            return { ...m, topics: newTopics }
          }
          return m
        })
      }
    })
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    setActiveId(null)
    
    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeContainer = state.milestones.find(m => m.topics.find((t: any) => t.name === activeId))?.id || 'unassigned'
    const overContainer = state.milestones.find(m => m.topics.find((t: any) => t.name === overId))?.id || 'unassigned'

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const items = activeContainer === 'unassigned' ? unassignedTopics : state.milestones.find(m => m.id === activeContainer)!.topics
      const oldIndex = items.findIndex(t => t.name === activeId)
      const newIndex = items.findIndex(t => t.name === overId)

      if (oldIndex !== newIndex) {
        setState(prev => {
          if (activeContainer === 'unassigned') return prev // Don't reorder unassigned
          return {
            ...prev,
            milestones: prev.milestones.map(m => {
              if (m.id === activeContainer) {
                return { ...m, topics: arrayMove(m.topics, oldIndex, newIndex) }
              }
              return m
            })
          }
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Organize Milestones (Optional)</h2>
          <p className="text-text-secondary text-sm">Group your topics into phases. If you skip this, we'll create a default goal.</p>
        </div>
        <button 
          onClick={addMilestone}
          className="flex items-center gap-2 px-4 py-2 bg-bg-container-low border border-border-default hover:bg-bg-container-high text-primary rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Phase
        </button>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6">
          {/* Unassigned Pool */}
          <div className="w-full md:w-80 flex flex-col bg-bg-base border border-border-default rounded-xl p-4 shrink-0 min-h-[460px]">
            <h3 className="font-mono text-xs font-bold uppercase text-primary mb-1 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              Unassigned Topics
            </h3>
            <p className="text-[11px] font-mono text-text-tertiary mb-4">{unassignedTopics.length} remaining to organize</p>
            
            <div className="flex-1 overflow-y-auto pr-1">
              <SortableContext id="unassigned" items={unassignedTopics.map(t => t.name)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[120px]">
                  {unassignedTopics.map((topic: any) => (
                    <SortableTopic key={topic.name} topic={topic} />
                  ))}
                  {unassignedTopics.length === 0 && (
                    <div className="flex items-center justify-center p-8 text-success font-mono text-xs bg-success/10 rounded-lg border border-success/20">
                      All topics assigned!
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          </div>

          {/* Milestones Horizontal Scroll */}
          <div className="flex-1 overflow-x-auto flex gap-4 pb-4">
            {state.milestones.map((milestone) => (
              <div key={milestone.id} className="w-80 shrink-0">
                <MilestoneContainer 
                  {...milestone} 
                  onRename={renameMilestone} 
                  onDelete={deleteMilestone}
                  onRemoveTopic={removeTopicFromMilestone}
                />
              </div>
            ))}
            {state.milestones.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-text-tertiary border-2 border-dashed border-border-default rounded-xl min-h-[460px] p-8 text-center">
                <FolderKanban className="w-12 h-12 mb-4 opacity-40 text-primary" />
                <p className="font-mono text-sm font-bold text-primary uppercase">No custom phases created yet.</p>
                <p className="text-xs font-mono text-text-secondary mt-1 max-w-sm">
                  Click "+ Add Phase" above to organize topics into stages, or proceed to have TRAP organize them automatically by category.
                </p>
              </div>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
          {activeId ? (
            <div className="p-3 bg-bg-surface border border-primary rounded-lg shadow-2xl opacity-90 cursor-grabbing">
              <p className="text-sm font-mono font-medium text-primary">{activeId}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="pt-6 mt-4 border-t border-border-default flex items-center justify-between gap-4 shrink-0">
        <button
          type="button"
          onClick={prevStep}
          className="px-6 py-3 rounded text-xs font-mono font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-bg-container-low transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-text-inverse hover:bg-secondary text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
        >
          Review Goal
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
