// Geometry mirrors HA's `ha-control-circular-slider` (270° arc, rotated so the
// gap sits at the bottom). Own implementation — no HA internals. Kept free of
// Lit so the maths stays testable without a DOM.
export const MAX_ANGLE = 270
export const ROTATE_ANGLE = 360 - MAX_ANGLE / 2 - 90
export const RADIUS = 145
export const VIEW = 320
export const CENTER = VIEW / 2
export const TRACK = (RADIUS * 2 * Math.PI * MAX_ANGLE) / 360

export type ActiveSlider = 'value' | 'low' | 'high'

/**
 * How a single-value arc fills: from the start, to the end, the whole arc, or
 * between `origin` and the value (either direction).
 */
export type SliderMode = 'start' | 'end' | 'full' | 'origin'

export const arcPath = (start: number, end: number): string => {
  const t1 = (start / 180) * Math.PI
  const t2 = (end / 180) * Math.PI
  const delta = t2 - t1
  const sX = RADIUS * Math.cos(t1)
  const sY = RADIUS * Math.sin(t1)
  const eX = RADIUS * Math.cos(t2)
  const eY = RADIUS * Math.sin(t2)
  return `M ${sX} ${sY} A ${RADIUS} ${RADIUS} 0 ${delta > Math.PI ? 1 : 0} ${delta > 0 ? 1 : 0} ${eX} ${eY}`
}

export const trackPath = arcPath(0, MAX_ANGLE)

export const pct = (value: number, min: number, max: number): number =>
  max === min ? 0 : (value - min) / (max - min)

export const angle = (value: number, min: number, max: number): number =>
  pct(value, min, max) * MAX_ANGLE

export const dash = (
  from: number,
  to: number,
  min: number,
  max: number
): [string, string] => {
  const start = pct(from, min, max)
  const end = pct(to, min, max)
  const arc = Math.max((end - start) * TRACK, 0)
  return [`${arc} ${TRACK - arc}`, `-${start * TRACK - 0.5}`]
}

export const clamp = (
  value: number,
  min: number,
  max: number,
  step: number
): number => {
  const stepped = Math.round(value / step) * step
  return Math.min(max, Math.max(min, Number(stepped.toFixed(4))))
}

export const percentFromPoint = (
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): number => {
  if (!rect.width) return 0
  const x = (2 * (clientX - rect.left - rect.width / 2)) / rect.width
  const y = (2 * (clientY - rect.top - rect.height / 2)) / rect.height
  const deg = (Math.atan2(y, x) * 180) / Math.PI
  const offset = (360 - MAX_ANGLE) / 2
  const wrapped = ((deg + offset - ROTATE_ANGLE + 360) % 360) - offset
  return Math.min(1, Math.max(0, wrapped / MAX_ANGLE))
}

export const nearestSlider = (
  value: number,
  low: number,
  high: number,
  dual: boolean
): ActiveSlider =>
  !dual
    ? 'value'
    : Math.abs(value - low) <= Math.abs(value - high)
      ? 'low'
      : 'high'

export const isLowDemand = (
  current: number,
  low: number,
  dual: boolean,
  mode: SliderMode
): boolean =>
  dual
    ? current <= low
    : mode === 'end'
      ? low <= current
      : mode === 'start'
        ? current <= low
        : false
