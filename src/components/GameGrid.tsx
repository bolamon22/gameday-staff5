'use client'
import type { ReactNode, DragEvent } from 'react'

export interface GameGridField {
  fullName: string
  venueName?: string
  fieldName: string
}

export interface GameGridCellCtx {
  slot: string
  field: GameGridField
}

export interface GameGridProps {
  /** Sorted time-slot strings (e.g. "08:00"). */
  slots: string[]
  /** Visible field columns, left to right. */
  fields: GameGridField[]
  /** Format a slot for the sticky time column. */
  fmtTime: (slot: string) => string
  /** Inner content for a cell — the page supplies its own game card / drop target. */
  renderCell: (ctx: GameGridCellCtx) => ReactNode
  /** Extra handlers/className spread onto each body <td> (drag-drop, highlight). */
  cellProps?: (ctx: GameGridCellCtx) => {
    className?: string
    onDragOver?: (e: DragEvent) => void
    onDragLeave?: (e: DragEvent) => void
    onDrop?: (e: DragEvent) => void
  }
  /** Make a given row taller when it holds a game. */
  rowTall?: (slot: string) => boolean
  /** Optional trailing header cell (e.g. an "+ Field" control). */
  addColumn?: ReactNode
}

/**
 * Shared time x field scheduling/assigning grid.
 * Owns the consistent table chrome (sticky time column, field headers,
 * row sizing) so the Scheduler and Assigner are visually identical and
 * cannot drift. Pages inject their own cell content via renderCell and
 * their own drag/drop behaviour via cellProps.
 */
export default function GameGrid({ slots, fields, fmtTime, renderCell, cellProps, rowTall, addColumn }: GameGridProps) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="border-collapse" style={{ minWidth: `${80 + fields.length * 160}px` }}>
        <thead className="sticky top-0 z-20">
          <tr>
            <th className="sticky left-0 z-30 w-20 bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 text-center">
              Time
            </th>
            {fields.map(f => (
              <th key={f.fullName} className="bg-slate-100 border border-slate-200 px-3 py-2 text-center min-w-[155px]">
                {f.venueName ? <div className="text-[10px] text-slate-400 font-normal">{f.venueName}</div> : null}
                <div className="text-xs font-semibold text-slate-700">{f.fieldName}</div>
              </th>
            ))}
            {addColumn ? <th className="bg-slate-100 border border-slate-200 px-2 py-2 text-center w-24">{addColumn}</th> : null}
          </tr>
        </thead>
        <tbody>
          {slots.map(slot => {
            const tall = rowTall ? rowTall(slot) : true
            return (
              <tr key={slot}>
                <td className="sticky left-0 z-10 bg-white border border-slate-200 px-2 py-1 text-xs text-slate-500 font-medium text-center whitespace-nowrap w-20">
                  {fmtTime(slot)}
                </td>
                {fields.map(field => {
                  const extra = cellProps ? cellProps({ slot, field }) : {}
                  const { className = '', ...handlers } = extra
                  return (
                    <td
                      key={field.fullName}
                      {...handlers}
                      className={`border border-slate-200 p-1 align-top ${tall ? 'h-16' : 'h-8'} bg-white transition-colors ${className}`}
                    >
                      {renderCell({ slot, field })}
                    </td>
                  )
                })}
                {addColumn ? <td className="border border-slate-200" /> : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
