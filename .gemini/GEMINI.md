# Project Context: Climate Group Helper

This document serves as the primary memory and architectural guide for the Climate Group Helper integration.

**CRITICAL:** Always read `tests/README.md` before running or writing any tests. 
The testing environment requires strict adherence to the **Event-Driven Testing Philosophy**:
1.  **Trust the Loop:** Never manually trigger state updates. Use `await hass.async_block_till_done()`.
2.  **Initialize Correctly:** Always await `group.async_added_to_hass()`.
3.  **Environment:** Use `UV_PROJECT_ENVIRONMENT=$HOME/.venvs/climate_group_helper uv run pytest`.

---

## 1. Core Architecture: Target State as Single Source of Truth

The synchronization logic uses a robust **"Persistent Target State"** model.

### The Core Concept
The group maintains a **Permanent Target State** (`target_state: TargetState`) that represents the intended state of the group.

*   **Persistence:** This state is **never deleted** automatically. It persists even when all devices are synced.
*   **Source of Truth:** This persistent target is the sole reference for Lock/Mirror enforcement, Window Control, and Schedule.
*   **Source-Based Updates:** Updates go through `update_target_state(source, **kwargs)` with access control.

### update_target_state(source, **kwargs)
```python
def update_target_state(self, source: str, **kwargs) -> bool:
    """Update target_state with source-based access control."""
    if self.blocking_mode and source not in ("schedule", "restore"):
        return False  # Blocked
    self.target_state = self.target_state.update(**kwargs)
    return True
```

| Source | Allowed during `blocking_mode` |
|--------|--------------------------------|
| `schedule` | ✅ Always (keeps target_state current for restore) |
| `restore` | ✅ Always (initial state setup) |
| `user` | ❌ Blocked |
| `sync_mode` | ❌ Blocked |

### Logic Flow
1.  **Internal Change (User → Group):**
    *   Calls `update_target_state("user", ...)`.
    *   Commands propagated via `call_debounced()`.
2.  **External Change (User → Member):**
    *   **Lock Mode:** `target_state` is **NOT** updated. Enforcement triggers.
    *   **Mirror Mode:** `update_target_state("sync_mode", ...)` called.
3.  **Schedule:**
    *   Calls `update_target_state("schedule", ...)` (always allowed).
    *   Executes via `call_immediate(context_id="schedule")`.
4.  **Window Control:**
    *   Does **NOT** modify `target_state`.
    *   Uses `call_hvac_off()` to force members OFF.
    *   Uses `call_immediate()` to restore from `target_state`.

---

## **2. Block**ing Mode Architecture

### Central Blocking Mechanism
A `blocking_mode` property on `ClimateGroup` indicates when service calls should be blocked:

```python
@property
def blocking_mode(self) -> bool:
    """Return True if any module is blocking hvac_mode changes."""
    return self.window_control_handler.force_off
```

### How It Works
1.  **`target_state` updates blocked** for `user`/`sync_mode` sources.
2.  **Service calls blocked** in `_generate_calls()` when `blocking_mode=True`.
3.  **Exception:** Calls with `context_id="window_control"` bypass the block.

### Call Methods
| Method | Use Case |
|--------|----------|
| `call_debounced()` | Normal user/sync operations (debounced, coalesces rapid changes) |
| `call_immediate(context_id=...)` | Window Control, Schedule (immediate, no debounce, tagged) |
| `call_hvac_off(context_id=...)` | Window Control only (bypasses target_state, forces members OFF) |

---

## 3. Smart Window Control [v0.16.0]

### Simplified Architecture
Window Control does **NOT** modify `target_state` at all:

*   **Window Opens:** Calls `call_hvac_off(context_id="window_control")` to force members OFF.
*   **Window Closes:** Calls `call_immediate(context_id="window_control")` to restore from `target_state`.
*   **Blocking:** Sets `blocking_mode=True` via `force_off` property.

### Key Behavior
- `target_state.hvac_mode` stays unchanged (e.g., `HEAT`) even when window is open.
- Schedule can update `target_state` while window is open (will be applied on close).
- No `restore_source` options needed - always restores from `target_state`.

### Config Flow
*   **Step:** `window_control` (sensors, delays only)
*   **Removed:** `restore_source`, `default_hvac_mode` options

### Priority Hierarchy
```
Window Control (Force Off) > Schedule > User Commands > Sync Mode
```

---

## 4. Schedule Entity Integration [v0.16.0]

### Overview
Links a native Home Assistant `schedule.*` entity to automate temperature/mode changes.

*   **Handler:** `ScheduleHandler` subscribes to schedule entity state changes.
*   **Slot Data:** Read from `state.attributes.get("data")` (YAML format).
*   **Valid Attributes:** All `ATTR_SERVICE_MAP` keys (temperature, hvac_mode, fan_mode, etc.).

### Example Schedule Slot Data
```yaml
temperature: 22.0
hvac_mode: heat
fan_mode: auto
```

### Echo Suppression
Uses `context_id="schedule"` to prevent Sync Mode from treating schedule changes as user actions.

### Startup Logic
*   `_schedule_init_done` flag tracks first initialization.
*   Schedule waits for `all_members_ready` before applying initial slot.
*   `STARTUP_BLOCK_DELAY` (5s) prevents member echoes from overwriting schedule.

---

## 5. Sync Mode Handler

### Resync Logic
`SyncModeHandler.resync()` runs on every member state change:

1.  **Skip if:** `sync_mode == STANDARD` or `startup_time < STARTUP_BLOCK_DELAY`
2.  **Skip if:** `blocking_mode == True` (Window Control active)
3.  **Skip if:** `event.context.id in ("window_control", "schedule")` (echo suppression)
4.  **Skip if:** `hvac_mode == OFF` and only setpoint attrs changed (meaningless)
5.  **Mirror Mode:** Call `update_target_state("sync_mode", ...)` - blocked during `blocking_mode`
6.  **Lock/Mirror:** Schedule enforcement via `call_debounced()`

### Selective Attribute Sync
*   Config: `CONF_SYNC_ATTRS` defines which attributes are enforced.
*   Implementation: `FilterState.from_keys()` creates a boolean mask.

---

## 6. Service Call Handler

### Key Methods
```python
async def call_immediate(filter_state=None, context_id=None):
    """Execute immediately without debouncing (for Window Control, Schedule)."""

async def call_debounced(filter_state=None, context_id=None):
    """Execute with debouncing (for normal user/sync operations)."""

async def call_hvac_off(context_id=None):
    """Force all members to OFF, bypassing target_state (Window Control only)."""
```

### Call Generation
`_generate_calls()` builds service calls by:
1.  Checking `blocking_mode` (early return if blocked, except `context_id="window_control"`)
2.  Iterating `target_state` attributes
3.  Comparing each member's current state vs target
4.  Grouping calls by service type

---

## 7. State Classes (state.py)

### TargetState
Immutable dataclass representing the group's intended state:
```python
@dataclass(frozen=True)
class TargetState:
    hvac_mode: str | None = None
    temperature: float | None = None
    # ... all climate attributes
    
    def update(self, **kwargs) -> "TargetState":
        """Immutable update pattern."""
```

### FilterState
Boolean mask for selective attribute operations:
```python
FilterState.from_keys(["temperature", "hvac_mode"])
# → FilterState(temperature=True, hvac_mode=True, fan_mode=False, ...)
```

### ChangeState
Tracks what changed between states (used by SyncModeHandler).

---

## 8. Migration Strategy (Config Version 6)

Uses a **"Soft Reset"** approach:
*   Takes all options/data from previous versions
*   Filters against `VALID_CONFIG_KEYS` whitelist
*   Discards deprecated/renamed keys silently

---

## 9. Known Issues & Warnings

### "Climate Wars"
**Scenario:** A device in TWO groups with active Sync Mode.
**Result:** Infinite fighting loop.
**Mitigation:** User must avoid this configuration.

---

## 10. Version History

### v0.16.0 (Window Control Simplification & Schedule)
*   **Refactor:** Window Control does NOT modify `target_state` anymore
*   **Feature:** `update_target_state(source, **kwargs)` with access control
*   **Feature:** `call_immediate()` for immediate service calls (no debounce)
*   **Feature:** `call_hvac_off()` for Window Control to force members OFF
*   **Feature:** `blocking_mode` property on ClimateGroup
*   **Feature:** Schedule Entity Integration with ScheduleHandler
*   **Feature:** Startup Sync Block (`STARTUP_BLOCK_DELAY = 5s`)
*   **Fix:** Sync Mode blocked during `blocking_mode`
*   **Removed:** `restore_source` options (no longer needed)
*   **Tests:** 125 passing (100%)

### v0.15.0 (Window Control + Sync Mode Stability)
*   **Feature:** Context-based echo suppression (`context_id`)
*   **Feature:** Smart Window Control with dual Room+Zone sensors
*   **Feature:** WindowControlHandler with timers and state restoration

### v0.14.0 (The "V4" Release)
*   **Refactor:** `TargetState` as Single Source of Truth
*   **Fix:** `FilterState.from_keys` defaults

---
**Status:** v0.16.0 | **Tests:** 125 Passing (100%)
