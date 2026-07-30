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
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Choose Focus Areas</h2>
          <p className="text-text-secondary text-sm">Select the categories you want to include in your preparation.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-base border border-border-default rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:border-violet-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {filteredCategories.map((cat) => {
            const isSelected = state.selectedCategories.includes(cat.name)
            // Calculate how many topics from this category are already selected in Step 3
            const selectedTopicsCount = state.selectedTopics.filter(t => (t.category || 'Other') === cat.name).length
            
            return (
              <div 
                key={cat.name}
                onClick={() => toggleCategory(cat.name)}
                className={`
                  relative p-5 rounded-xl border cursor-pointer transition-all duration-200 group
                  ${isSelected 
                    ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                    : 'border-border-default bg-white/[0.02] hover:bg-white/[0.04] hover:border-text-tertiary'}
                `}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 text-violet-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-text-secondary'}`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className={`font-semibold ${isSelected ? 'text-violet-400' : 'text-text-primary'}`}>
                    {cat.name}
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Topics Available</span>
                    <span className="font-medium text-text-primary">{cat.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Est. Time</span>
                    <span className="font-medium text-text-primary">{Math.round(cat.hours)}h</span>
                  </div>
                  
                  {/* Difficulty Bar */}
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-text-tertiary mb-1">
                      <span>Difficulty Split</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-black/40">
                      <div className="bg-success" style={{ width: `${(cat.easy / cat.count) * 100}%` }} title={`Easy: ${cat.easy}`} />
                      <div className="bg-warning" style={{ width: `${(cat.medium / cat.count) * 100}%` }} title={`Medium: ${cat.medium}`} />
                      <div className="bg-error" style={{ width: `${(cat.hard / cat.count) * 100}%` }} title={`Hard: ${cat.hard}`} />
                    </div>
                  </div>

                  {selectedTopicsCount > 0 && (
                    <div className="mt-4 pt-3 border-t border-border-default text-xs font-medium text-violet-400">
                      {selectedTopicsCount} topics currently selected
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-text-tertiary">
            No categories found matching "{searchTerm}"
          </div>
        )}
      </div>

      <div className="pt-6 mt-2 border-t border-border-default flex justify-between shrink-0">
        <button
          onClick={prevStep}
          className="px-6 py-2 rounded-lg font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={!isValid}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-glow-sm"
        >
          Select Topics
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
