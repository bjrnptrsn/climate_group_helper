import type { ReactiveController, ReactiveControllerHost } from 'lit'

/**
 * A badge's icon width, the `.badge svg` width in the status styles; a label
 * narrower than it leaves the badge this wide.
 */
export const BADGE_ICON = 22
const MIN_GAP = 6
const MAX_GAP = 16

export interface BadgeFit {
  /** Icons only: the labels do not fit on one line even at the smallest gap. */
  compact: boolean
  /** The gap between two badges, in px. */
  gap: number
}

/**
 * How a row of badges fits `available` px on one line: the labels with the
 * widest gap up to 16 px, at least 6 px; below that every badge drops its
 * label, all at once, so the row reads alike.
 */
export const fitBadges = (available: number, labelWidths: readonly number[]): BadgeFit => {
  const gaps = Math.max(1, labelWidths.length - 1)
  const room = (widths: number[]): number =>
    (available - widths.reduce((sum, w) => sum + w, 0)) / gaps
  const full = labelWidths.map((w) => Math.max(BADGE_ICON, w))
  const compact = labelWidths.length > 1 && room(full) < MIN_GAP
  const widths = compact ? full.map(() => BADGE_ICON) : full
  return { compact, gap: Math.min(MAX_GAP, Math.max(MIN_GAP, Math.floor(room(widths)))) }
}

/**
 * Keeps a row of badges on one line: measures it after every update and on
 * every resize of the host, and re-renders the host when the fit changes. The
 * labels are measured in both modes (`scrollWidth` holds while a compact label
 * is collapsed to zero width), so the decision never depends on itself.
 */
export class BadgeFitController implements ReactiveController {
  fit: BadgeFit = { compact: false, gap: MAX_GAP }
  private _observer?: ResizeObserver

  constructor(
    private readonly host: ReactiveControllerHost & HTMLElement,
    private readonly row: () => HTMLElement | null | undefined
  ) {
    host.addController(this)
  }

  hostConnected(): void {
    if (typeof ResizeObserver === 'undefined') return
    this._observer = new ResizeObserver(() => this._measure())
    this._observer.observe(this.host)
  }

  hostDisconnected(): void {
    this._observer?.disconnect()
    this._observer = undefined
  }

  hostUpdated(): void {
    this._measure()
  }

  private _measure(): void {
    const row = this.row()
    const available = row?.clientWidth
    // Not laid out: hidden, or no layout engine.
    if (!row || !available) return
    const labels = row.querySelectorAll<HTMLElement>(':scope > .badge > span')
    // `scrollWidth` is rounded; one pixel each keeps a rounded-down label from
    // pushing the last badge onto a second line.
    const next = fitBadges(
      available,
      Array.from(labels, (label) => label.scrollWidth + 1)
    )
    if (next.compact !== this.fit.compact || next.gap !== this.fit.gap) {
      this.fit = next
      this.host.requestUpdate()
    }
  }
}
