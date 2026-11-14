import type { ReactiveController, ReactiveControllerHost } from 'lit'
import type { HassEntity } from '../types'

// How long a sent value stands in for the entity's own. The group reports a new
// target only after its debounce and the members' echo; a command it drops
// (e.g. during a window block) must not leave the dial on that value for good.
export const PENDING_TIMEOUT_MS = 10_000

/**
 * Target values sent to the entity but not yet reported back — shown right away
 * and used as the base for the next step, so quick clicks each count.
 *
 * Any change of the reported value ends its pending value: confirmed or
 * overridden from elsewhere, the entity is authoritative again. Leaving the page
 * drops everything — the timeout that would have ended it goes with it.
 */
export class PendingController<K extends string> implements ReactiveController {
  private _values: Partial<Record<K, number>> = {}
  private _timer?: ReturnType<typeof setTimeout>

  /**
   * `read` returns the reported value of a key — by default the attribute of
   * that name. An entity whose value is its state (a `number`) passes
   * `(entity) => entity?.state`.
   */
  constructor(
    private readonly host: ReactiveControllerHost,
    private readonly read: (entity: HassEntity | undefined, key: K) => unknown = (
      entity,
      key
    ) => entity?.attributes[key]
  ) {
    host.addController(this)
  }

  get(key: K): number | undefined {
    return this._values[key]
  }

  set(values: Partial<Record<K, number>>): void {
    this._values = { ...this._values, ...values }
    clearTimeout(this._timer)
    this._timer = setTimeout(() => this.clear(), PENDING_TIMEOUT_MS)
    this.host.requestUpdate()
  }

  /** Call from the host's `willUpdate` when the watched entity changed. */
  sync(old: HassEntity | undefined, current: HassEntity | undefined): void {
    for (const key of Object.keys(this._values) as K[]) {
      if (
        old?.entity_id !== current?.entity_id ||
        this.read(old, key) !== this.read(current, key)
      ) {
        delete this._values[key]
      }
    }
  }

  clear(): void {
    clearTimeout(this._timer)
    this._timer = undefined
    this._values = {}
    this.host.requestUpdate()
  }

  hostDisconnected(): void {
    this.clear()
  }
}
