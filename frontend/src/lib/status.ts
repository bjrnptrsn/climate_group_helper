import type { TranslationKey } from './i18n'
import type { HassEntity, HomeAssistant } from '../types'

/**
 * Label of the schedule panel for the backend's `active_schedule_layer`. A
 * missing attribute (before the first slot read) or `none` reads as the plain
 * schedule.
 */
export function scheduleLayerKey(layer: unknown): TranslationKey {
  if (layer === 'bypass') return 'status.layer_bypass'
  if (layer === 'fallback') return 'status.layer_fallback'
  return 'source.schedule'
}

/**
 * Attributes whose per-member values the member list shows while the group
 * disagrees on them, in display order. The setpoints are absent on purpose:
 * every row already shows its own target.
 */
export const MEMBER_DIVERGENCE_ATTRS = [
  'hvac_mode',
  'preset_mode',
  'fan_mode',
  'swing_mode',
  'swing_horizontal_mode',
  'humidity',
] as const

const TEMPERATURE_ATTRS = ['temperature', 'target_temp_low', 'target_temp_high']
// The backend's FLOAT_TOLERANCE.
const FLOAT_TOLERANCE = 0.05

/** How long after a target change members may still be catching up. */
export const DEVIATION_QUIET_MS = 3000

/**
 * Milliseconds left in the quiet window after the group's last target change
 * (`last_changed`), 0 once it is over. Members report a new command one after
 * another; until they have, the slow ones are not deviating yet.
 */
export function deviationQuietRemaining(
  group: Record<string, unknown> | undefined,
  now: number = Date.now()
): number {
  const changed = Date.parse(String(group?.last_changed ?? ''))
  if (Number.isNaN(changed)) return 0
  return Math.max(0, changed + DEVIATION_QUIET_MS - now)
}

/**
 * Whether a member's value in a divergence misses what the group commands:
 * `target_state`, shifted by the group and member offset for setpoints.
 * `member_divergence` names no culprit; the target does.
 *
 * Unknown means no: during a boost or block the members run on another value
 * on purpose, a Range Template moves covered members onto a band edge the card
 * cannot tell apart, and an off group may park members on their minimum. A
 * member that does not offer the target mode was switched off by the group
 * itself (`member` carries its attributes). Right after a target change the
 * members are still catching up (`deviationQuietRemaining()`).
 */
export function deviatesFromTarget(
  group: Record<string, unknown> | undefined,
  id: string,
  attr: string,
  value: unknown,
  member?: Record<string, unknown>,
  now: number = Date.now()
): boolean {
  if (!group) return false
  if (((group.blocking_sources as string[] | undefined) ?? []).length) return false
  if (group.boost_until) return false
  if (deviationQuietRemaining(group, now) > 0) return false
  const target = (group.target_state as Record<string, unknown> | undefined) ?? {}
  const expected = target[attr]
  if (expected == null || value == null) return false

  if (TEMPERATURE_ATTRS.includes(attr)) {
    if (((group.enabled_features as string[] | undefined) ?? []).includes('range_template')) {
      return false
    }
    if (target.hvac_mode === 'off') return false
    const offsets = (group.member_offsets as Record<string, number> | undefined) ?? {}
    const shifted =
      Number(expected) + ((group.group_offset as number | undefined) ?? 0) + (offsets[id] ?? 0)
    return Math.abs(Number(value) - shifted) > FLOAT_TOLERANCE
  }
  if (attr === 'humidity') {
    return Math.abs(Number(value) - Number(expected)) > FLOAT_TOLERANCE
  }
  // A device that does not list its modes may still take any of them.
  const modes = member?.hvac_modes
  if (attr === 'hvac_mode' && Array.isArray(modes) && !modes.includes(expected)) return false
  return String(value) !== String(expected)
}

/**
 * One member's value in a divergence, formatted like HA's more-info.
 * `hvac_mode` is the entity's state, so it goes through the state formatter.
 */
export function divergenceValue(
  hass: HomeAssistant | undefined,
  id: string,
  attr: string,
  value: unknown
): string {
  const member = hass?.states[id]
  const formatted = !member
    ? undefined
    : attr === 'hvac_mode'
      ? hass?.formatEntityState?.(member, String(value))
      : hass?.formatEntityAttributeValue?.(member, attr, value)
  return formatted ?? String(value)
}

/**
 * Priority of the status panel: the highest active state wins, otherwise the
 * component falls back to the target's source. Mirrors the group's blocking
 * hierarchy (`switch > window > presence`) followed by boost, hold, schedule.
 */
export const PANEL_ORDER = [
  'switch',
  'window',
  'presence',
  'boost',
  'hold',
  'schedule',
] as const

export function selectPanelItem<T extends { kind: string }>(
  items: readonly T[],
  order: readonly string[] = PANEL_ORDER
): T | undefined {
  for (const kind of order) {
    const match = items.find((item) => item.kind === kind)
    if (match) return match
  }
  return undefined
}

export interface MemberDot {
  id: string
  state: string
  isolated: boolean
  oob: boolean
  /** Misses the group target on a disputed attribute (`deviatingMembers()`). */
  deviates: boolean
  master: boolean
}

/**
 * Members that miss the group target on at least one disputed attribute —
 * `deviatesFromTarget()` applied across `member_divergence`.
 */
export function deviatingMembers(
  group: Record<string, unknown> | undefined,
  states: Record<string, HassEntity | undefined> = {}
): string[] {
  const divergence =
    (group?.member_divergence as Record<string, Record<string, unknown>> | undefined) ?? {}
  const ids = new Set<string>()
  for (const [attr, members] of Object.entries(divergence)) {
    for (const [id, value] of Object.entries(members)) {
      if (deviatesFromTarget(group, id, attr, value, states[id]?.attributes)) ids.add(id)
    }
  }
  return [...ids]
}

/**
 * Per-member dot model for the panel, read from `hass.states`. A missing member
 * counts as `unavailable` (offline/unpaired) rather than silently as active.
 */
export function memberDots(
  members: readonly string[],
  states: Record<string, HassEntity | undefined>,
  isolated: readonly string[] = [],
  oob: readonly string[] = [],
  master?: string,
  deviating: readonly string[] = []
): MemberDot[] {
  return members.map((id) => ({
    id,
    state: states[id]?.state ?? 'unavailable',
    isolated: isolated.includes(id),
    oob: oob.includes(id),
    deviates: deviating.includes(id),
    master: id === master,
  }))
}

/**
 * CSS classes for a dot: activity state plus the isolated/OOB/deviation/master
 * markers.
 * An offline master is the master fallback — its dot is the card's only hint.
 */
export function memberDotClass(dot: MemberDot): string {
  const activity =
    dot.state === 'off'
      ? 'off'
      : dot.state === 'unavailable' || dot.state === 'unknown'
        ? 'unavailable'
        : 'active'
  const marks = [
    dot.isolated ? 'isolated' : '',
    dot.oob ? 'oob' : '',
    dot.deviates ? 'deviates' : '',
    dot.master ? 'master' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return marks ? `${activity} ${marks}` : activity
}
