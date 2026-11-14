// MDI icons, re-exported from `@mdi/js` (SVG paths only — no HA internals).
import {
  mdiAccountArrowRight,
  mdiAccountGroup,
  mdiAlertOutline,
  mdiArrowOscillating,
  mdiBattery,
  mdiBattery10,
  mdiBattery20,
  mdiBattery30,
  mdiBattery40,
  mdiBattery50,
  mdiBattery60,
  mdiBattery70,
  mdiBattery80,
  mdiBattery90,
  mdiBatteryAlertVariantOutline,
  mdiBatteryOutline,
  mdiCallSplit,
  mdiChevronRight,
  mdiCrownOutline,
  mdiCalendarClock,
  mdiDotsVertical,
  mdiFan,
  mdiFire,
  mdiGestureTap,
  mdiInformationOutline,
  mdiLockOutline,
  mdiPlusMinusVariant,
  mdiPower,
  mdiRestore,
  mdiRocketLaunch,
  mdiSnowflake,
  mdiSunSnowflakeVariant,
  mdiSync,
  mdiThermometer,
  mdiThermostat,
  mdiThermostatAuto,
  mdiTimerSand,
  mdiTuneVariant,
  mdiWaterPercent,
  mdiWindowOpenVariant,
} from '@mdi/js'

export const MDI_THERMOMETER = mdiThermometer
export const MDI_THERMOSTAT = mdiThermostat
export const MDI_RESTORE = mdiRestore
export const MDI_WATER_PERCENT = mdiWaterPercent
export const MDI_DOTS_VERTICAL = mdiDotsVertical
export const MDI_CHEVRON_RIGHT = mdiChevronRight
export const MDI_PLUS_MINUS_VARIANT = mdiPlusMinusVariant
export const MDI_FIRE = mdiFire
export const MDI_SNOWFLAKE = mdiSnowflake
export const MDI_POWER = mdiPower
export const MDI_FAN = mdiFan
export const MDI_SUN_SNOWFLAKE = mdiSunSnowflakeVariant
export const MDI_THERMOSTAT_AUTO = mdiThermostatAuto
export const MDI_TUNE = mdiTuneVariant
export const MDI_ARROW_OSCILLATING = mdiArrowOscillating
export const MDI_WINDOW_OPEN_VARIANT = mdiWindowOpenVariant
export const MDI_ACCOUNT_ARROW_RIGHT = mdiAccountArrowRight
export const MDI_ROCKET_LAUNCH = mdiRocketLaunch
export const MDI_TIMER_SAND = mdiTimerSand
export const MDI_LOCK_OUTLINE = mdiLockOutline
export const MDI_ALERT_OUTLINE = mdiAlertOutline
export const MDI_INFORMATION_OUTLINE = mdiInformationOutline
export const MDI_CROWN_OUTLINE = mdiCrownOutline
export const MDI_CALENDAR_CLOCK = mdiCalendarClock
export const MDI_SYNC = mdiSync
export const MDI_GESTURE_TAP = mdiGestureTap
export const MDI_ACCOUNT_GROUP = mdiAccountGroup
export const MDI_CALL_SPLIT = mdiCallSplit
export const MDI_BATTERY_ALERT_VARIANT_OUTLINE = mdiBatteryAlertVariantOutline
export const MDI_BATTERY_OUTLINE = mdiBatteryOutline
export const MDI_BATTERY = mdiBattery

const BATTERY_LEVEL_ICONS: Record<number, string> = {
  10: mdiBattery10,
  20: mdiBattery20,
  30: mdiBattery30,
  40: mdiBattery40,
  50: mdiBattery50,
  60: mdiBattery60,
  70: mdiBattery70,
  80: mdiBattery80,
  90: mdiBattery90,
  100: mdiBattery,
}

/**
 * MDI battery icon for a level in percent, rounded to tens like HA's
 * `batteryLevelIcon()`. At 5 % and below the empty outline, not HA's alert
 * variant: its exclamation mark would lie on its side in the rotated mark.
 */
export const batteryLevelIcon = (level: number): string => {
  if (level <= 5) return mdiBatteryOutline
  return BATTERY_LEVEL_ICONS[Math.min(100, Math.round(level / 10) * 10)]
}

/** MDI icon for an HVAC mode (mirrors HA's `climateHvacModeIcon`). */
export const hvacModeIcon = (mode: string): string => {
  switch (mode) {
    case 'cool':
      return MDI_SNOWFLAKE
    case 'dry':
      return MDI_WATER_PERCENT
    case 'fan_only':
      return MDI_FAN
    case 'auto':
      return MDI_THERMOSTAT_AUTO
    case 'heat':
      return MDI_FIRE
    case 'off':
      return MDI_POWER
    case 'heat_cool':
      return MDI_SUN_SNOWFLAKE
    default:
      return MDI_THERMOMETER
  }
}
