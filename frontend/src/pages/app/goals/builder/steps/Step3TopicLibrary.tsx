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
      default: return 'bg-white/5 text-text-secondary border-white/10'
    }
  }

  // Calculate totals for UI
  const totalHours = state.selectedTopics.reduce((acc, t) => acc + (t.estimated_hours || 0), 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-1">Topic Library</h2>
          <p className="text-text-secondary text-sm">Select the specific topics you want to master.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 min-w-[200px]">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-base border border-border-default rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:border-violet-400 focus:outline-none"
            />
          </div>
          
          <select 
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            className="bg-bg-base border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-2 border-b border-border-default mb-4 shrink-0">
        <div className="flex items-center gap-4 text-sm">
          <button onClick={selectAll} className="text-violet-400 hover:text-violet-300 font-medium">Select All</button>
          <span className="text-border-default">|</span>
          <button onClick={deselectAll} className="text-text-secondary hover:text-text-primary">Deselect All</button>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="text-text-secondary">{state.selectedTopics.length} selected</span>
          <span className="flex items-center gap-1 text-violet-400 bg-violet-400/10 px-2 py-1 rounded">
            <Clock className="w-3.5 h-3.5" />
            {Math.round(totalHours)}h total
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 min-h-0 space-y-2">
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
                p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4
                ${isSelected 
                  ? 'border-violet-500 bg-violet-500/5' 
                  : 'border-border-default bg-white/[0.01] hover:bg-white/[0.04] hover:border-text-tertiary'}
              `}
            >
              <div className="shrink-0 text-violet-400">
                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-text-tertiary" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-text-primary truncate">{topic.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getDifficultyColor(topic.difficulty)}`}>
                    {topic.difficulty}
                  </span>
                  <span className="text-xs text-text-tertiary">{topic.category}</span>
                </div>
                
                {askingCompanies.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-text-secondary uppercase font-semibold">Hot at:</span>
                    <div className="flex gap-1">
                      {askingCompanies.map(c => (
                        <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                  {topic.estimated_hours}h
                </span>
              </div>
            </div>
          )
        })}
        {filteredTopics.length === 0 && (
          <div className="text-center py-12 text-text-tertiary">
            No topics found matching your criteria.
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
          disabled={state.selectedTopics.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-glow-sm"
        >
          Organize Milestones
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
