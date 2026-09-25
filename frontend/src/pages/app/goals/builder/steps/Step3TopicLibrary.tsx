import { useBuilderContext } from '../GoalBuilder'
import { ArrowRight, Search, Clock, CheckSquare, Square } from 'lucide-react'
import { useGoalStore } from '@/store/goal.store'
import { useState, useMemo } from 'react'

export function Step3TopicLibrary() {
  const { state, setState, nextStep, prevStep } = useBuilderContext()
  const { topicLibrary, companyIntelligence } = useGoalStore()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [diffFilter, setDiffFilter] = useState<string>('all')

  // Filter library based on selected categories from Step 2, search term, and difficulty
  const filteredTopics = useMemo(() => {
    return topicLibrary.filter(topic => {
      const cat = topic.category || 'Other'
      if (!state.selectedCategories.includes(cat)) return false
      
      if (diffFilter !== 'all' && topic.difficulty !== diffFilter) return false
      
      if (searchTerm) {
        return topic.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
               cat.toLowerCase().includes(searchTerm.toLowerCase())
      }
      return true
    }).sort((a, b) => {
      // Sort by category then by sort_order
      const catA = a.category || 'Other'
      const catB = b.category || 'Other'
      if (catA !== catB) return catA.localeCompare(catB)
      return (a.sort_order || 0) - (b.sort_order || 0)
    })
  }, [topicLibrary, state.selectedCategories, searchTerm, diffFilter])

  const toggleTopic = (topic: any) => {
    setState(prev => {
      const exists = prev.selectedTopics.find(t => t.name === topic.name)
      if (exists) {
        return { ...prev, selectedTopics: prev.selectedTopics.filter(t => t.name !== topic.name) }
      } else {
        return { ...prev, selectedTopics: [...prev.selectedTopics, topic] }
      }
    })
  }

  const selectAll = () => {
    setState(prev => {
      // Add all filtered topics that aren't already in selectedTopics
      const newSelections = [...prev.selectedTopics]
      filteredTopics.forEach(ft => {
        if (!newSelections.find(t => t.name === ft.name)) {
          newSelections.push(ft)
        }
      })
      return { ...prev, selectedTopics: newSelections }
    })
  }

  const deselectAll = () => {
    setState(prev => {
      // Remove all filtered topics from selectedTopics
      const filteredNames = new Set(filteredTopics.map(t => t.name))
      return {
        ...prev,
        selectedTopics: prev.selectedTopics.filter(t => !filteredNames.has(t.name))
      }
    })
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-success/10 text-success border-success/20'
      case 'medium': return 'bg-warning/10 text-warning border-warning/20'
      case 'hard': return 'bg-error/10 text-error border-error/20'
      default: return 'bg-bg-container-low text-text-secondary border-border-default'
    }
  }

  // Calculate totals for UI
  const totalHours = state.selectedTopics.reduce((acc, t) => acc + (t.estimated_hours || 0), 0)

  return (
    <div className="flex flex-col space-y-6">
      {/* Header and Filter Row */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border-default border-dashed pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-xl font-bold font-display text-primary uppercase tracking-tight">
              Topic Library
            </h2>
          </div>
          <p className="text-text-secondary text-xs font-mono mt-1">
            Handpick specific DSA algorithms, data structures, and concepts for your goal.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72 min-w-[200px]">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-base border border-border-default rounded-md pl-9 pr-4 py-2.5 text-xs text-primary placeholder:text-text-tertiary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>
          
          <select 
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            className="bg-bg-base border border-border-default rounded-md px-3 py-2.5 text-xs font-mono text-primary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-bg-container-low/40 border border-border-default">
        <div className="flex items-center gap-4 text-xs font-mono">
          <button 
            type="button" 
            onClick={selectAll} 
            className="text-primary hover:underline font-bold cursor-pointer"
          >
            Select All ({filteredTopics.length})
          </button>
          <span className="text-border-default">|</span>
          <button 
            type="button" 
            onClick={deselectAll} 
            className="text-text-secondary hover:text-primary transition-colors cursor-pointer"
          >
            Deselect All
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-text-secondary">
            <span className="font-bold text-primary">{state.selectedTopics.length}</span> topics selected
          </span>
          <span className="flex items-center gap-1 text-primary bg-bg-surface border border-border-default px-2.5 py-1 rounded font-bold">
            <Clock className="w-3.5 h-3.5" />
            {Math.round(totalHours)}h estimated
          </span>
        </div>
      </div>

      {/* Topics List - Natural Flow */}
      <div className="space-y-2.5">
        {filteredTopics.map((topic, idx) => {
          const isSelected = !!state.selectedTopics.find(t => t.name === topic.name)
          
          // Determine if target companies frequently ask this
          const askingCompanies = []
          for (const company of state.targetCompanies) {
            const compData = companyIntelligence[company]
            if (compData && compData.frequently_asked_topics?.includes(topic.name)) {
              askingCompanies.push(company)
            }
          }

          return (
            <div 
              key={`${topic.name}-${idx}`}
              onClick={() => toggleTopic(topic)}
              className={`
                p-4 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col sm:flex-row sm:items-center gap-4
                ${isSelected 
                  ? 'border-primary bg-bg-container-low ring-1 ring-primary/40 shadow-sm' 
                  : 'border-border-default bg-bg-surface hover:bg-bg-container-low/50 hover:border-text-tertiary'}
              `}
            >
              <div className="shrink-0 text-primary">
                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-text-tertiary" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className={`font-mono text-sm font-bold truncate ${isSelected ? 'text-primary' : 'text-primary'}`}>
                    {topic.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${getDifficultyColor(topic.difficulty)}`}>
                    {topic.difficulty}
                  </span>
                  <span className="text-xs font-mono text-text-tertiary">[{topic.category}]</span>
                </div>
                
                {askingCompanies.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] font-mono text-text-secondary uppercase font-bold">Targeted by:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {askingCompanies.map(c => (
                        <span key={c} className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0 text-xs font-mono text-text-secondary">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-container-high/60 border border-border-default">
                  <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                  {topic.estimated_hours}h
                </span>
              </div>
            </div>
          )
        })}
        {filteredTopics.length === 0 && (
          <div className="text-center py-16 text-text-tertiary font-mono text-xs">
            No topics found matching your filters.
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
          disabled={state.selectedTopics.length === 0}
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-text-inverse hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold uppercase tracking-wider rounded transition-colors cursor-pointer shadow-sm"
        >
          Organize Milestones
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
