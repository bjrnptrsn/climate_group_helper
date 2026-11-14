import type { ReactiveController, ReactiveControllerHost } from 'lit'

/**
 * Re-renders the host once when a time-bound state it rendered runs out — for
 * windows too short for `LiveClockController`'s ticker. After every update it
 * asks `remaining()` how long the current state still holds and arms a single
 * timer for that moment.
 */
export class WakeController implements ReactiveController {
  private _timer?: number

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly remaining: () => number
  ) {
    host.addController(this)
  }

  hostUpdated(): void {
    this._clear()
    const ms = this.remaining()
    // A small margin, so the re-render lands after the boundary, not on it.
    if (ms > 0) this._timer = window.setTimeout(() => this.host.requestUpdate(), ms + 50)
  }

  hostDisconnected(): void {
    this._clear()
  }

  private _clear(): void {
    if (this._timer !== undefined) {
      window.clearTimeout(this._timer)
      this._timer = undefined
    }
  }
}
