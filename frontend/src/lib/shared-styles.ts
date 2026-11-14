import { css } from 'lit'

/**
 * The feature-row tile (`cgh-select-tile`, `cgh-action-tile`): a quiet surface
 * with a hairline edge, the icon in a round chip. `--accent` colours the chip —
 * the mode tile sets it to the dial's colour; `.active` (a preset set, a boost
 * running) also tints the surface, in the primary colour unless `--accent` is
 * set.
 */
export const tileStyles = css`
  .tile {
    width: 100%;
    height: 48px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px 6px 8px;
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    border-radius: var(--ha-border-radius-lg, 16px);
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
    overflow: hidden;
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      transform 100ms ease;
  }
  .tile:hover {
    background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
  }
  .tile:active:not(:disabled) {
    transform: scale(0.98);
  }
  .tile:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .chip {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    transition: background-color 150ms ease;
  }
  .chip svg {
    width: 18px;
    height: 18px;
    fill: var(--secondary-text-color);
    transition: fill 150ms ease;
  }
  .tile.active {
    --accent: var(--primary-color);
  }
  .tile.accented .chip,
  .tile.active .chip {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }
  .tile.accented .chip svg,
  .tile.active .chip svg {
    fill: var(--accent);
  }
  .tile.active {
    border-color: color-mix(in srgb, var(--accent) 30%, transparent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
  }
  .tile.active:hover {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }
`

/** Big centre number of a dial view (`bigNumber()` in `climate-display.ts`). */
export const bigNumberStyles = css`
  .big {
    display: inline-flex;
    align-items: flex-end;
    font-size: 57px;
    line-height: 1.12;
    letter-spacing: -0.25px;
  }
  .addon {
    display: flex;
    flex-direction: column-reverse;
    padding: 4px 0;
  }
  .decimal {
    font-size: 0.42em;
    line-height: 1.33;
    min-height: 1.33em;
  }
  .unit {
    font-size: 0.33em;
    line-height: 1.2;
    white-space: nowrap;
  }
`

/**
 * A dial without −/+ buttons gives up the empty strip they sit in: the ring's
 * round end caps reach 274.5 of the 320 square, so 12.5% of the width goes and
 * about 5px stay as air. Decided by the config, not the state — an `off` group
 * shows no buttons either, and its dial must not jump.
 */
export const dialStyles = css`
  .dial.no-buttons {
    margin-bottom: calc(min(100%, var(--cgh-content-width, 320px)) * -0.125);
  }
`

/** Glow behind a dial in the colour of `--cgh-action-color`. */
export const glowStyles = css`
  .glow {
    position: absolute;
    inset: -10%;
    border-radius: 50%;
    background: radial-gradient(
      50% 50% at 50% 50%,
      var(--cgh-action-color, transparent) 0%,
      transparent 100%
    );
    opacity: 0.15;
    pointer-events: none;
  }
`

/**
 * Member status dot, shared by the panel's dot strip and the member list:
 * activity colour, isolated/OOB/deviation markers, and a glow when coloured.
 */
export const memberDotStyles = css`
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    box-sizing: border-box;
    background: var(--disabled-color, #9e9e9e);
    flex: none;
  }
  .dot.active {
    background: var(--primary-color);
    box-shadow: 0 0 6px var(--primary-color);
  }
  .dot.unavailable {
    background: transparent;
    border: 1px solid var(--disabled-color, #9e9e9e);
    opacity: 0.5;
  }
  .dot.isolated {
    outline: 1px dashed var(--divider-color, rgba(255, 255, 255, 0.24));
    outline-offset: 1px;
  }
  /* Size, not an outline/border: those already mean isolated/OOB/deviating/
     offline, and a master can be any of them. */
  .dot.master {
    width: 12px;
    height: 12px;
  }
  /* Misses the group target: the warning ring without OOB's glow. */
  .dot.deviates {
    outline: 1px solid var(--warning-color, #ff9800);
    outline-offset: 1px;
  }
  .dot.oob {
    outline: 1px solid var(--warning-color, #ff9800);
    outline-offset: 1px;
    box-shadow: 0 0 6px var(--warning-color, #ff9800);
  }
`
