"""Reset coordinator for Climate Group Helper."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import replace
import logging
from typing import TYPE_CHECKING

from homeassistant.exceptions import HomeAssistantError, ServiceValidationError

from .const import (
    ATTR_RESET_BOOST,
    ATTR_RESET_BYPASS,
    ATTR_RESET_FALLBACK,
    ATTR_RESET_OFFSET,
    ATTR_RESET_PRESETS,
    ATTR_RESET_SCHEDULE,
    META_KEY_GROUP_OFFSET,
)
from .number import async_push_group_offset

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper

_LOGGER = logging.getLogger(__name__)


async def _async_reset_offset(group: ClimateGroupHelper) -> None:
    """Clear the group offset and the schedule's ownership marker for it.

    `offset_set_callback` is the complete path — it writes `run_state` *and*
    pulls the Number entity along, so the slider shows the reset. The direct
    write is the fallback for a group without that entity.
    """
    if group.offset_set_callback:
        await group.offset_set_callback(0.0)
    else:
        group.run_state = replace(group.run_state, group_offset=0.0)

    if META_KEY_GROUP_OFFSET in group.run_state.config_overrides:
        group.run_state = group.run_state.clear_config_overrides({META_KEY_GROUP_OFFSET})

    group.async_defer_or_update_ha_state()


async def async_reset_group(
    group: ClimateGroupHelper,
    everything: bool = False,
    boost: bool = False,
    offset: bool = False,
    schedule: bool = False,
    bypass: bool = False,
    fallback: bool = False,
    presets: bool = False,
) -> None:
    """Reset runtime states (boost, offset, schedule, bypass, fallback, presets).

    `everything` resets every option and makes the other
    flags redundant. A call that selects nothing at all is rejected rather than
    silently treated as "reset everything": in the UI every unticked box looks
    exactly like that call, and in YAML the intent would be invisible to whoever
    reads the automation next.
    """
    fields = (boost, offset, schedule, bypass, fallback, presets)
    if not everything and not any(fields):
        raise ServiceValidationError(
            "Select at least one option to reset, or set 'everything' to reset all of them."
        )

    reset_boost, reset_offset, reset_schedule, reset_bypass, reset_fallback, reset_presets = (
        everything or f for f in fields
    )

    # Order matters: the schedule handlers run with apply=False and are followed by a
    # single on_slot_change() below, so no step dispatches an intermediate state.
    # The boost abort runs with push=False — the restore push happens once, at
    # the end, together with the offset push (diff-based, so a slot re-apply
    # that already reconciled the members turns them into no-ops).
    # Bypass reset is the exception: switching away from an active bypass entity
    # is itself a transition and is processed as such inside
    # update_bypass_entity(), regardless of apply=False.
    steps: list[tuple[str, bool, Callable[[], Awaitable[None] | None]]] = [
        (ATTR_RESET_BOOST, reset_boost, lambda: group.boost_override_manager.abort(push=False)),
        (ATTR_RESET_PRESETS, reset_presets, lambda: group.preset_manager.async_update_runtime_presets(None)),
        (ATTR_RESET_OFFSET, reset_offset, lambda: _async_reset_offset(group)),
        (ATTR_RESET_SCHEDULE, reset_schedule, lambda: group.schedule_handler.update_schedule_entity(None, apply=False)),
        (ATTR_RESET_BYPASS, reset_bypass, lambda: group.schedule_bypass_handler.update_bypass_entity(None, apply=False)),
        (ATTR_RESET_FALLBACK, reset_fallback, lambda: group.schedule_handler.update_fallback_payload(None, apply=False)),
    ]

    succeeded: list[str] = []
    failed: list[str] = []

    # Each step is independent: one failure must not stop the others, so the errors
    # are collected and raised together once everything has run.
    for name, requested, action in steps:
        if not requested:
            continue
        try:
            if (result := action()) is not None:
                await result
            succeeded.append(name)
        except Exception:
            _LOGGER.exception("[%s] Reset failed for %s", group.entity_id, name)
            failed.append(name)

    # Re-apply the slot once after all requested resets complete. The re-apply
    # may end up pushing nothing — no schedule entity, an inactive slot without
    # fallback, or a slot payload lacking the reset attribute.
    schedule_changed = any(
        key in succeeded for key in (ATTR_RESET_SCHEDULE, ATTR_RESET_BYPASS, ATTR_RESET_FALLBACK)
    )
    if schedule_changed or (group.schedule_handler.schedule_entity_id and (reset_offset or reset_presets)):
        try:
            await group.schedule_handler.on_slot_change()
        except Exception as err:
            _LOGGER.exception("[%s] Reset failed during slot reapply: %s", group.entity_id, err)

    # Final pushes: the boost-abort and offset steps ran without pushing, so
    # the restored state reaches the members here. Both are diff-based — a slot
    # re-apply that already reconciled the members turns them into no-ops, and
    # the offset push (one diff against target_state) also covers a boost
    # restore. Independent of each other: a failed offset push must not swallow
    # the boost restore ("one failure must not stop the others").
    if reset_offset and ATTR_RESET_OFFSET in succeeded:
        try:
            await async_push_group_offset(group)
        except Exception as err:
            _LOGGER.exception("[%s] Reset failed pushing group offset: %s", group.entity_id, err)
    if reset_boost and ATTR_RESET_BOOST in succeeded:
        try:
            await group.override_call_handler.call_immediate()
        except Exception as err:
            _LOGGER.exception("[%s] Reset failed pushing target state: %s", group.entity_id, err)

    _LOGGER.info(
        "[%s] Reset completed: reset=%s, failed=%s",
        group.entity_id,
        succeeded or "(none)",
        failed or "(none)",
    )

    if failed:
        raise HomeAssistantError(f"Reset failed for: {', '.join(failed)}")
