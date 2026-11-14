import type { ReactiveController, ReactiveControllerHost } from 'lit'

/**
 * Re-renders the host on a fixed interval so countdowns (boost, schedule hold)
 * stay live. One shared ticker per component; time formatting is left to the
 * caller so it can honor HA's timezone.
 */
export class LiveClockController implements ReactiveController {
  private _timer?: number

  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly intervalMs = 15000
  ) {
    host.addController(this)
  }

  hostConnected(): void {
    this._timer = window.setInterval(
      () => this.host.requestUpdate(),
      this.intervalMs
    )
  }

  hostDisconnected(): void {
    if (this._timer !== undefined) {
      window.clearInterval(this._timer)
      this._timer = undefined
    }
  }
}
