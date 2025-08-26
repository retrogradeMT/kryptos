// composables/useScytale.ts
// Scytale helper that produces a rectangular matrix of cells and common readouts
// Works with Nuxt 3 + TS

export interface ScytaleCell {
  char: string
  row: number
  col: number
  color?: string
}

export interface ScytaleOptions {
  /** rotate columns to the right by k (per-row shift) */
  offset?: number
  /** reverse each row left↔right after offset */
  reverseRows?: boolean
  /** reverse row order (vertical flip) */
  reverseCols?: boolean
  /** pad the final short row to full diameter with this char (default ' ') */
  padChar?: string
}

/**
 * Build a scytale-wrapped grid (row-major fill, fixed column count = diameter)
 *
 * Example (text ABCDEFG, D=3):
 *  A B C
 *  D E F
 *  G _ _
 */
export function getWrappedGrid(text: string, diameter: number, opts: ScytaleOptions = {}): ScytaleCell[][] {
  const t = (text ?? '')
  const D = Math.max(2, Math.floor(diameter) || 2)
  const pad = opts.padChar ?? ' '

  // Build row-major matrix with D columns
  const rows = Math.ceil(t.length / D)
  const out: ScytaleCell[][] = Array.from({ length: rows }, (_, r) => Array.from({ length: D }, (_, c) => ({ char: pad, row: r, col: c })))

  let i = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < D; c++) {
      const ch = i < t.length ? t[i++] : pad
      out[r][c] = { char: ch, row: r, col: c }
    }
  }

  // Column offset (rotate each row right by k)
  const k = ((opts.offset ?? 0) % D + D) % D
  if (k) {
    for (let r = 0; r < rows; r++) {
      const row = out[r]
      const shifted = row.map((_, c) => row[(c - k + D) % D])
      out[r] = shifted.map((cell, c) => ({ ...cell, col: c }))
    }
  }

  // Horizontal flip (reverse within each row)
  if (opts.reverseRows) {
    for (let r = 0; r < rows; r++) {
      const rev = out[r].slice().reverse()
      out[r] = rev.map((cell, c) => ({ ...cell, col: c }))
    }
  }

  // Vertical flip (reverse row order)
  if (opts.reverseCols) {
    out.reverse()
    for (let r = 0; r < out.length; r++) {
      for (let c = 0; c < D; c++) out[r][c].row = r
    }
  }

  return out
}

/** Read text row by row (left→right, top→bottom) */
export function toTextByRows(grid: ScytaleCell[][], trimEnd = false): string {
  if (!grid?.length) return ''
  const s = grid.map(row => row.map(c => c.char).join('')).join('\n')
  return trimEnd ? s.replace(/\s+$/g, '') : s
}

/** Read text column by column (top→bottom, left→right) */
export function toTextByCols(grid: ScytaleCell[][], joinLines = true, trimEnd = false): string {
  if (!grid?.length) return ''
  const rows = grid.length
  const cols = grid[0]?.length || 0
  const lines: string[] = []
  for (let c = 0; c < cols; c++) {
    let col = ''
    for (let r = 0; r < rows; r++) col += grid[r][c]?.char ?? ''
    lines.push(col)
  }
  const s = joinLines ? lines.join('') : lines.join('\n')
  return trimEnd ? s.replace(/\s+$/g, '') : s
}

/**
 * Nuxt composable wrapper (kept simple so you can import functions directly too)
 */
export const useScytale = () => ({ getWrappedGrid, toTextByRows, toTextByCols })
