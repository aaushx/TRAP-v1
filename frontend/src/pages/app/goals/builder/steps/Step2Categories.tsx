import { useBuilderContext } from '../GoalBuilder'
import { ArrowRight, Layers, CheckCircle2, Search } from 'lucide-react'
import { useGoalStore } from '@/store/goal.store'
import { useMemo, useState } from 'react'

export function Step2Categories() {
  const { state, setState, nextStep, prevStep } = useBuilderContext()
  const { topicLibrary } = useGoalStore()
  const [searchTerm, setSearchTerm] = useState('')

  // Aggregate category data from the topic library
  const categories = useMemo(() => {
    const map = new Map<string, { count: number, hours: number, easy: number, medium: number, hard: number }>()
    topicLibrary.forEach(topic => {
      const cat = topic.category || 'Other'
      if (!map.has(cat)) {
        map.set(cat, { count: 0, hours: 0, easy: 0, medium: 0, hard: 0 })
      }
      const data = map.get(cat)!
      data.count += 1
      data.hours += topic.estimated_hours || 0
      if (topic.difficulty === 'easy') data.easy++
      else if (topic.difficulty === 'medium') data.medium++
      else data.hard++
    })
    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      ...stats
    })).sort((a, b) => b.count - a.count)
  }, [topicLibrary])

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const toggleCategory = (catName: string) => {
    setState(prev => ({
      ...prev,
      selectedCategories: prev.selectedCategories.includes(catName)
        ? prev.selectedCategories.filter(c => c !== catName)
        : [...prev.selectedCategories, catName]
    }))
  }

  const isValid = state.selectedCategories.length > 0

  return (
    <div className="flex flex-col space-y-6">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-default border-dashed pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-xl font-bold font-display text-primary uppercase tracking-tight">
              Choose Focus Areas
            </h2>
          </div>
          <p className="text-text-secondary text-xs font-mono mt-1">
            Select the DSA and CS foundational categories you want to include in your roadmap.
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-base border border-border-default rounded-md pl-9 pr-4 py-2.5 text-xs text-primary placeholder:text-text-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Categories Grid - Natural Flow without internal scroll traps */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const isSelected = state.selectedCategories.includes(cat.name)
            const selectedTopicsCount = state.selectedTopics.filter(t => (t.category || 'Other') === cat.name).length
            
            return (
              <div 
                key={cat.name}
                onClick={() => toggleCategory(cat.name)}
                className={`
                  relative p-5 rounded-xl border cursor-pointer transition-all duration-200 group flex flex-col justify-between
                  ${isSelected 
                    ? 'border-primary bg-bg-container-low ring-1 ring-primary shadow-sm' 
                    : 'border-border-default bg-bg-surface hover:bg-bg-container-low/60 hover:border-text-tertiary'}
                `}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-text-inverse' : 'bg-bg-container-high text-text-secondary'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className={`font-mono text-sm font-bold uppercase tracking-tight ${isSelected ? 'text-primary' : 'text-primary'}`}>
                      {cat.name}
                    </h3>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Topics Available</span>
                      <span className="font-bold text-primary">{cat.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Est. Prep Time</span>
                      <span className="font-bold text-primary">{Math.round(cat.hours)}h</span>
                    </div>
                    
                    {/* Difficulty Distribution Bar */}
                    <div className="pt-1.5">
                      <div className="flex justify-between text-[10px] text-text-tertiary mb-1">
                        <span>Difficulty Split</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-bg-container-high">
                        <div className="bg-success" style={{ width: `${(cat.easy / cat.count) * 100}%` }} title={`Easy: ${cat.easy}`} />
                        <div className="bg-warning" style={{ width: `${(cat.medium / cat.count) * 100}%` }} title={`Medium: ${cat.medium}`} />
                        <div className="bg-error" style={{ width: `${(cat.hard / cat.count) * 100}%` }} title={`Hard: ${cat.hard}`} />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTopicsCount > 0 && (
                  <div className="mt-4 pt-3 border-t border-border-default text-[11px] font-mono font-bold text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {selectedTopicsCount} topics currently selected
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {filteredCategories.length === 0 && (
          <div className="text-center py-16 text-text-tertiary font-mono text-xs">
            No categories found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="pt-6 border-t border-border-default flex items-center justify-between gap-4">
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
          disabled={!isValid}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-text-inverse hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
        >
          Select Topics
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
