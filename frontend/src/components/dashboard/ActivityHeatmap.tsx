import { useMemo } from 'react'
import { motion } from 'framer-motion'

// Color scale mapped to activity levels 0-4 (Nothing OS monochrome scale)
const LEVEL_COLORS = [
  '#efeded',     // 0 — empty
  '#e4e2e2',     // 1 — low
  '#c4c7c7',     // 2 — medium
  '#747878',     // 3 — high
  '#111111',     // 4 — max
] as const

const CELL_SIZE = 12
const CELL_GAP = 2
const WEEKS = 20
const DAYS = 7

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''] as const
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

interface DayCell {
  date: Date
  level: number
  dateStr: string
}

interface ActivityHeatmapProps {
  data?: Record<string, number>
}

function processHeatmapData(backendData: Record<string, number>): DayCell[] {
  const today = new Date()
  const cells: DayCell[] = []
  const totalDays = WEEKS * DAYS

  const start = new Date(today)
  start.setDate(start.getDate() - totalDays + 1)
  start.setDate(start.getDate() - start.getDay())

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)

    const dateKey = date.toISOString().split('T')[0]
    const count = backendData[dateKey] || 0
    
    let level = 0
    if (date <= today) {
      if (count > 0 && count <= 2) level = 1
      else if (count > 2 && count <= 4) level = 2
      else if (count > 4 && count <= 6) level = 3
      else if (count > 6) level = 4
    }

    cells.push({
      date,
      level,
      dateStr: date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    })
  }
  return cells
}

export function ActivityHeatmap({ data = {} }: ActivityHeatmapProps) {
  const cells = useMemo(() => processHeatmapData(data), [data])
  
  const total = useMemo(
    () => Object.values(data).reduce((sum, count) => sum + count, 0),
    [data]
  )

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1

    for (let i = 0; i < cells.length; i++) {
      const month = cells[i].date.getMonth()
      if (month !== lastMonth) {
        const col = Math.floor(i / DAYS)
        labels.push({ label: MONTH_NAMES[month], col })
        lastMonth = month
      }
    }
    return labels
  }, [cells])

  const gridWidth = WEEKS * (CELL_SIZE + CELL_GAP) - CELL_GAP
  const dayLabelWidth = 28

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05, ease: 'easeOut' }}
      className="surface-card p-5 relative group"
    >
      {/* Top Stripe Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-bg-container-high rounded-t-md opacity-20 dot-matrix-strip"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 mt-1 border-b border-border-default border-dashed pb-3">
        <h3 className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest">Activity Matrix</h3>
        <span className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">
          {total} Operations Registered
        </span>
      </div>

      {/* Heatmap Container */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div style={{ minWidth: gridWidth + dayLabelWidth + 8 }}>
          {/* Month labels row */}
          <div
            className="flex text-[9px] font-mono text-text-tertiary mb-1 uppercase tracking-wider"
            style={{ paddingLeft: dayLabelWidth + 4 }}
          >
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  position: 'relative',
                  left: m.col * (CELL_SIZE + CELL_GAP),
                  marginRight: -(CELL_SIZE + CELL_GAP),
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid with day labels */}
          <div className="flex gap-1">
            {/* Day labels column */}
            <div
              className="flex flex-col justify-between text-[9px] font-mono text-text-tertiary shrink-0 uppercase tracking-wider"
              style={{
                width: dayLabelWidth,
                height: DAYS * (CELL_SIZE + CELL_GAP) - CELL_GAP,
              }}
            >
              {DAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  className="leading-none"
                  style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex gap-[2px]">
              {Array.from({ length: WEEKS }, (_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[2px]">
                  {Array.from({ length: DAYS }, (_, dayIdx) => {
                    const cell = cells[weekIdx * DAYS + dayIdx]
                    if (!cell) return null
                    return (
                      <div
                        key={dayIdx}
                        title={`${cell.dateStr}: Level ${cell.level}`}
                        className="rounded-[1px] transition-colors duration-100 border border-transparent hover:border-primary cursor-crosshair"
                        style={{
                          width: CELL_SIZE,
                          height: CELL_SIZE,
                          backgroundColor: LEVEL_COLORS[cell.level],
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-4 text-[9px] font-mono uppercase tracking-wider text-text-tertiary border-t border-border-default border-dashed pt-3">
        <span className="mr-1">Less</span>
        {LEVEL_COLORS.map((color, i) => (
          <div
            key={i}
            className="rounded-[1px] border border-border-subtle"
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              backgroundColor: color,
            }}
          />
        ))}
        <span className="ml-1">More</span>
      </div>
    </motion.div>
  )
}
export default ActivityHeatmap
