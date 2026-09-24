"""Service call execution logic for the climate group."""

from __future__ import annotations

import asyncio
import logging
import time
from abc import ABC
from dataclasses import dataclass, replace
from typing import TYPE_CHECKING, Any, Callable, Final

from homeassistant.components.climate import (
    ATTR_HVAC_MODE,
    ATTR_HVAC_MODES,
    ATTR_HUMIDITY,
    ATTR_PRESET_MODE,
    ATTR_TARGET_TEMP_HIGH,
    ATTR_TARGET_TEMP_LOW,
    ATTR_TEMPERATURE,
    DEFAULT_MIN_TEMP,
    DOMAIN as CLIMATE_DOMAIN,
    PRESET_NONE,
    SERVICE_SET_HVAC_MODE,
    SERVICE_SET_TEMPERATURE,
    HVACMode,
)
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import Context, State
from homeassistant.helpers.debounce import Debouncer

from .const import (
    MODE_MODES_MAP,
    TEMP_TARGET_ATTRS,
    ATTR_SERVICE_MAP,
    CONF_FEATURE_STRATEGY,
    CONF_FORCE_RETRY,
    CONF_IGNORE_OFF_MEMBERS_PRESENCE,
    CONF_IGNORE_OFF_MEMBERS_SYNC,
    CONF_IGNORE_OFF_MEMBERS_SCHEDULE,
    CONF_UNION_OUT_OF_BOUNDS_ACTION,
    CONF_UNION_UNSUPPORTED_HVAC_ACTION,
    FLOAT_TOLERANCE,
    OVERRIDE_ENFORCE_DEBOUNCE_DELAY,
    RANGE_TEMPLATE_DEBOUNCE_DELAY,
    FeatureStrategy,
    PresenceOffRespect,
    SyncMode,
    UnionOutOfBoundsAction,
    UnsupportedHvacAction,
)
from .aggregation import within_tolerance
from .state import FilterState, available_state, other_active_members

if TYPE_CHECKING:
    from .climate import ClimateGroupHelper
    from .state import TargetState

_LOGGER = logging.getLogger(__name__)


class SyncTarget:
    """Sentinel: sync every attribute against target_state.

    Carries no payload of its own — it marks the call as "resolve the payload
    from target_state", which happens per pass in `_generate_calls_from_dict`.

    Its own type rather than None, which reads as "no value" and was routinely
    mistaken for "send nothing" — the opposite of what it means.
    """

    def __repr__(self) -> str:
        return "SYNC_TARGET"


SYNC_TARGET: Final = SyncTarget()


@dataclass
class DispatchEntry:
    """Entry in the outgoing command dispatch queue."""

    data: dict[str, Any] | SyncTarget

    def matches(self, new_data: dict[str, Any] | SyncTarget) -> bool:
        """Whether an incoming call may collapse into this entry."""
        if self.data is SYNC_TARGET and new_data is SYNC_TARGET:
            return True
        if self.data is not SYNC_TARGET and new_data is not SYNC_TARGET:
            return self.data.keys() == new_data.keys()
        return False


class BaseServiceCallHandler(ABC):
    """Base class for service call execution with debouncing and retry logic.

    This abstract base class provides the common infrastructure for:
    - Debouncing multiple rapid changes into a single execution
    - Superseding an older command with a newer one by handing the newest payload
      to the run already in flight, rather than cancelling it (see `call_debounced`)
    - Stale-call detection to abort zombie calls that arrived too late
    - Retry logic for failed operations
    - Context-based call tagging for echo detection

    Derived classes must implement `_generate_calls()` to define how calls are generated.
    Hook methods (`_block_all_calls`, `_block_call_attr`, `_is_stale_call`, etc.) can be
    overridden per handler type to customise blocking and injection behaviour.
    """

    CONTEXT_ID: str = "service_call"  # Default context ID, override in derived classes

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the service call handler.

        Args:
            group: Reference to the parent ClimateGroupHelper entity.
        """
        self._group = group
        self._hass = group.hass
        # Per-handler cooldown for call_debounced. Defaults to the group config
        # value; reactive handlers (block enforcement, template changeover) set
        # their own fixed value so a large user-tuned UI cooldown cannot delay
        # their correction.
        self._debounce_delay: float = group.debounce_delay
        self._debouncer: Debouncer[Any] | None = None
        self._active_tasks: set[asyncio.Task[Any]] = set()
        self._call_triggers: list[Callable[[dict[str, Any] | SyncTarget], Any]] = []
        self._lock = asyncio.Lock()
        self._pending_queue: list[DispatchEntry] = []
        # OOB marking collected by _process_oob_guard during call generation and
        # applied by _execute_calls once the calls have gone out.
        self._pending_oob_add: set[str] = set()
        self._pending_oob_discard: set[str] = set()

    @property
    def target_state(self) -> TargetState:
        """Return the shared target state."""
        return self._group.shared_target_state

    async def async_cancel_all(self) -> None:
        """Cancel all active debouncers and running retry tasks."""
        self._pending_queue.clear()

        if self._debouncer:
            self._debouncer.async_cancel()

        for task in self._active_tasks:
            task.cancel()

        if self._active_tasks:
            await asyncio.gather(*self._active_tasks, return_exceptions=True)

    async def async_shutdown(self) -> None:
        """Permanently shutdown the handler and its debouncer."""
        await self.async_cancel_all()
        if self._debouncer:
            self._debouncer.async_shutdown()
            self._debouncer = None

    def register_call_trigger(self, callback: Callable[[dict[str, Any] | SyncTarget], Any]) -> None:
        """Register a callback to be called after successful execution.

        The callback receives the outgoing payload so triggers can react to the
        command (e.g. BoostOverrideManager.abort() must know when the user
        commands OFF so it does not restore the pre-boost snapshot over it).
        """
        if callback not in self._call_triggers:
            self._call_triggers.append(callback)

    def _resolve_virtual_preset(self, data: dict[str, Any] | SyncTarget) -> dict[str, Any] | SyncTarget:
        """Merge a virtual preset's payload and translate its name for the devices.

        `resolve_preset()` keeps the virtual name (the state side tracks it in
        `active_virtual_preset`); no device knows it, so the execution side
        replaces it with the native expectation `PRESET_NONE`.
        """
        data = self._group.preset_manager.resolve_preset(data)
        if isinstance(data, dict) and self._group.preset_manager.is_virtual(data.get(ATTR_PRESET_MODE)):
            return {**data, ATTR_PRESET_MODE: PRESET_NONE}
        return data

    async def call_immediate(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> None:
        """Execute a service call immediately without debouncing."""
        data = self._resolve_virtual_preset(data)
        async with self._lock:
            await self._execute_calls(data)

    def _call_trigger(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> None:
        """Trigger all registered execution callbacks with the outgoing payload."""
        for callback_func in self._call_triggers:
            try:
                callback_func(data)
            except Exception:
                _LOGGER.exception("[%s] Error in execution callback", self._group.entity_id)

    async def call_debounced(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> None:
        """Debounce and execute a service call.

        A new call never cancels a run already in flight — `_execute_calls` makes
        real, `blocking=True` service calls that can take seconds, and cancelling
        mid-batch would abort it after only some of its entities had been sent.
        Instead incoming tasks are queued in `_pending_queue`, and the run
        already executing processes them in strict FIFO order once its current pass finishes.
        Tail collapsing ensures rapid updates for the same attribute set (e.g. slider movements)
        update the waiting tail entry in-place rather than queueing duplicates.

        The Debouncer cannot deliver that payload on its own: it runs its function
        under `_execute_lock` and drops a trigger arriving while that lock is held,
        which is correct for an idempotent refresh but not here, where every call
        carries its own frozen payload.

        `async_cancel_all()` (entity shutdown, blocking-source activation via
        window/switch/boost override managers) clears the queue and cancels outright — those
        genuinely want nothing further sent.
        """
        data = self._resolve_virtual_preset(data)

        if self._pending_queue and self._pending_queue[-1].matches(data):
            if data is not SYNC_TARGET:
                self._pending_queue[-1].data = data
        else:
            self._pending_queue.append(DispatchEntry(data=data))

        async def debounce_func() -> None:
            """Drive the pending queue in FIFO order until empty."""
            task = asyncio.current_task()
            if task:
                self._active_tasks.add(task)
            try:
                async with self._lock:
                    while self._pending_queue:
                        entry = self._pending_queue.pop(0)
                        await self._execute_calls(entry.data)
            except asyncio.CancelledError:
                pass  # Cancelled by shutdown or a blocking-source activation.
            finally:
                if task:
                    self._active_tasks.discard(task)

        if not self._debouncer:
            self._debouncer = Debouncer(
                self._hass,
                logger=_LOGGER,
                cooldown=self._debounce_delay,
                immediate=False,
                function=debounce_func,
            )
        else:
            self._debouncer.async_cancel()
            self._debouncer.function = debounce_func

        await self._debouncer.async_call()

    async def _execute_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> None:
        """Execute service calls with retry logic."""
        # Never below one: the first pass is the command itself, not a retry.
        # A negative count would otherwise skip the loop entirely and silently
        # send nothing at all.
        attempts = max(1, 1 + self._group.retry_attempts)
        delay = self._group.retry_delay
        context_id = self.CONTEXT_ID

        # Check blocking BEFORE retry loop (state doesn't change between retries)
        if self._block_all_calls(data):
            _LOGGER.debug("[%s] Calls suppressed (source=%s): Blocking mode active (e.g. Window open)", self._group.entity_id, context_id)
            return

        # Trigger hook for calls — passes the payload so abort() can distinguish
        # a user OFF command (which must survive) from other manual changes.
        self._call_trigger(data)

        # Note: the retry loop deliberately has no success-break. Diff-based handlers
        # terminate naturally once members report the target state (no pending calls).
        # Non-diffing handlers (ClimateCallHandler, force_retry) resend on every
        # attempt — that blind resend IS the retry feature for unreliable devices
        # ("Always retry sending commands ... even if they already report the target
        # state"), since HA service calls don't raise when a device silently ignores
        # a command.
        for attempt in range(attempts):
            # Entities whose service call completed successfully this attempt.
            # Tracked per attempt so the exception handler below can mark exactly
            # the members that actually received a command — never one whose call
            # raised before it reached the device.
            sent_entity_ids: set[str] = set()
            try:
                # Drop a previous attempt's pending marking — this generation
                # re-evaluates every member against the current states.
                self._pending_oob_add.clear()
                self._pending_oob_discard.clear()

                calls = self._generate_calls(data)

                if not calls:
                    # Nothing to send: a member found in range needs its marking
                    # cleared even without a call (the OFF-restore call is only
                    # built for members currently OFF).
                    self._apply_pending_oob()
                    _LOGGER.debug("[%s] No pending calls, stopping retry loop", self._group.entity_id)
                    # The group's mode refreshes on the echo of the calls below,
                    # and a Range Template member in the deadband may need none —
                    # nothing would carry the new mode into the group's state.
                    # Narrow, because this exit runs constantly.
                    if (
                        self._group.member_template_manager.range_template is not None
                        and self._group.shared_target_state.hvac_mode is not None
                        and self._group.hvac_mode != self._group.shared_target_state.hvac_mode
                    ):
                        self._group.async_defer_or_update_ha_state()
                    return

                parent_id = self._get_parent_id()
                member_command_delay = self._group.member_command_delay

                if member_command_delay:
                    calls = self._split_calls_by_entity(calls)

                # The radio-path lock spans the whole batch, not one call:
                # released between calls, a calibration flush already waiting
                # would slip into the sub-ms handoff right after a call —
                # effectively simultaneous on the same device. Held until one
                # pass of the call loop is done; the retry loop's retry_delay
                # gap between attempts is outside it (member_command_scope is
                # entered fresh on each attempt).
                async with self._group.member_command_scope():
                    for index, call in enumerate(calls):
                        service = call["service"]
                        service_data = {ATTR_ENTITY_ID: call["entity_ids"], **call["kwargs"]}

                        # Stale guard: evaluated only when the running entry is the
                        # youngest (len(_pending_queue) == 0). If subsequent entries
                        # are queued (e.g. temperature followed by hvac_mode: off),
                        # intermediate steps must be sent completely to all members
                        # rather than aborting mid-batch and leaving members in an
                        # inconsistent state.
                        if not self._pending_queue and self._is_stale_call(call):
                            _LOGGER.debug("[%s] Aborting stale call: kwargs=%s no longer match target_state", self._group.entity_id, call["kwargs"])
                            # Calls earlier in this batch already went out — their OOB
                            # marking must not be lost just because a later call in the
                            # same batch went stale. Restricted to sent_entity_ids: a
                            # fully stale batch (nothing sent) must still leave no
                            # marking behind, and entities from calls that never went
                            # out must not be marked based on a decision that was
                            # never executed.
                            self._apply_pending_oob(sent_entity_ids)
                            return

                        if index > 0 and member_command_delay:
                            await asyncio.sleep(member_command_delay)

                        await self._hass.services.async_call(
                            domain=CLIMATE_DOMAIN,
                            service=service,
                            service_data=service_data,
                            blocking=True,
                            context=Context(id=context_id, parent_id=parent_id),
                        )

                        # Only a successfully completed send counts as "sent" for OOB
                        # marking — a call that raises below must not mark an entity
                        # that never received the command.
                        sent_entity_ids.update(call["entity_ids"])

                        _LOGGER.debug("[%s] Call %d/%d (%d/%d) '%s' with data: %s, Parent ID: %s",
                                      self._group.entity_id, index + 1, len(calls), attempt + 1,
                                      attempts, service, service_data, parent_id
                        )

                # The calls went out — only now may the OOB marking be applied.
                self._apply_pending_oob()

                await self._after_call_trigger(data)

            except Exception as error:
                error_msg = str(error)
                if "not_valid_hvac_mode" in error_msg:
                    _LOGGER.debug("[%s] Call attempt (%d/%d) skipped (not supported): %s", self._group.entity_id, attempt + 1, attempts, error_msg)
                else:
                    _LOGGER.warning("[%s] Call attempt (%d/%d) failed: %s", self._group.entity_id, attempt + 1, attempts, error)
                # Calls that already went out before the exception still acted on
                # their members — keep their OOB marking (restricted to the sent
                # entities) so the next sync does not re-drive them as if they
                # were in range.
                self._apply_pending_oob(sent_entity_ids)

            if attempts > 1 and attempt < (attempts - 1):
                await asyncio.sleep(delay)

    def _generate_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate service calls. Must be implemented by derived classes."""
        return self._generate_calls_from_dict(data, filter_state)

    def _generate_calls_from_dict(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate service calls from a dict of target attributes.

        Central template method for call generation. Each attribute is selected
        (`_is_callable_attr` → `_build_*_initial_calls`) and the resulting raw
        calls are routed through `_run_pipeline`. The two bounds of a temperature
        range resolve into a single bundled call, so the first of them builds it
        and the second is skipped.

        Args:
            data: Dict of attribute values to sync. Defaults to target_state.
            filter_state: Optional FilterState for attribute filtering.
                          Attributes with False are skipped.
        """
        data = self.target_state.to_dict() if data is SYNC_TARGET else data
        filter_attrs = (filter_state or FilterState()).to_dict()

        calls: list[dict[str, Any]] = []
        range_bundled = False

        for attr, value in data.items():
            if not self._is_callable_attr(data, attr, value, filter_attrs):
                continue

            if attr in (ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH):
                # Both bounds ship in ONE set_temperature call — build it once.
                if range_bundled:
                    continue
                range_bundled = True
                raw = self._build_temperature_range_initial_calls(data, filter_attrs)
            else:
                raw = self._build_attr_initial_calls(attr, value)

            if raw:
                calls.extend(self._run_pipeline(raw))

        # Pipeline stages may empty an entity list (e.g. unsupported-hvac filtering).
        return [call for call in calls if call.get("entity_ids")]

    def _is_callable_attr(self, data: dict[str, Any], attr: str, value: Any, filter_attrs: dict[str, Any]) -> bool:
        """Whether `attr` should produce a service call at all (pre-entity-selection)."""
        if value is None:
            return False
        if not filter_attrs.get(attr, True):
            return False
        # Wake-up bug prevention: irrelevant attributes for the target mode.
        return not self._block_call_attr(data, attr)

    def _build_attr_initial_calls(self, attr: str, value: Any) -> list[dict[str, Any]]:
        """Select entities for a single attribute and build its raw call."""
        entity_ids = self._get_call_entity_ids(attr, value)
        # hvac_mode proceeds even with no capable entities: _process_unsupported_hvac
        # may generate OFF calls for members that advertise modes but not this one.
        if not entity_ids and attr != ATTR_HVAC_MODE:
            return []
        return self._build_initial_call(attr, value, entity_ids)

    def _run_pipeline(self, raw_calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Run raw initial calls through the full call processing pipeline.

        Every stage has the signature `list[dict] -> list[dict]` and passes
        non-applicable calls through unchanged. Order matters: offsets stack
        additively, the range template needs the offset-applied values, and the
        OOB guard must see the final numbers — it is always last.
        """
        processed = self._process_unsupported_hvac(raw_calls)
        processed = self._process_min_temp_off(processed)
        processed = self._process_member_offset(processed)
        processed = self._process_group_offset(processed)
        processed = self._process_range_template(processed)
        return self._process_oob_guard(processed)

    def _build_temperature_range_initial_calls(
        self, data: dict[str, Any], filter_attrs: dict[str, bool] | None = None
    ) -> list[dict[str, Any]]:
        """Build the raw bundled `set_temperature` call(s) for target_temp_low/high.

        HA Core's `set_temperature` schema requires both bounds together
        (`vol.Inclusive`) and rejects a call carrying only one, so a lone bound
        must be completed before the call is built. Completion happens in two
        tiers: the group-wide `target_state` value first, and — only when
        `target_state` itself never carries the other bound — a per-entity
        fallback (`_complete_bounds_per_entity`).

        `raw_kwargs` always carries the *group* band, never a per-entity
        completion: it feeds the range-template band cache, which must hold the
        last commanded group band rather than one member's local value.

        **`filter_attrs` has to be applied here, not only per attribute.** The
        caller filters each attribute before dispatching to a builder, but this
        builder reads *both* bounds straight out of `data` — so a bound that
        `sync_attributes` excludes would still ride along in the bundle's kwargs
        and, worse, pull in members that deviate on nothing else. An excluded
        bound therefore selects no entities, and its schema-mandated value is
        completed *per member from that member's own state* — filling it from
        `target_state` would correct the very bound the user excluded from sync.
        """
        filtered = filter_attrs or {}
        low_synced = filtered.get(ATTR_TARGET_TEMP_LOW, True)
        high_synced = filtered.get(ATTR_TARGET_TEMP_HIGH, True)

        low = data.get(ATTR_TARGET_TEMP_LOW) if low_synced else None
        high = data.get(ATTR_TARGET_TEMP_HIGH) if high_synced else None
        if low is None and high is None:
            return []

        # Diff low and high independently — a member in sync on one but
        # deviating on the other must still receive the combined call.
        low_entities = self._get_call_entity_ids(ATTR_TARGET_TEMP_LOW, low) if low is not None else []
        high_entities = self._get_call_entity_ids(ATTR_TARGET_TEMP_HIGH, high) if high is not None else []
        entity_ids = list(dict.fromkeys(low_entities + high_entities))
        if not entity_ids:
            return []

        # An excluded bound stays None on purpose: leaving it out of the group
        # band routes the call through the per-entity completion below, which
        # fills it from the member's own state instead of correcting it.
        group_low = low if (low is not None or not low_synced) else self.target_state.target_temp_low
        group_high = high if (high is not None or not high_synced) else self.target_state.target_temp_high
        group_band = {ATTR_TARGET_TEMP_LOW: group_low, ATTR_TARGET_TEMP_HIGH: group_high}

        # Common case: the group band is complete — one bundled call for everyone.
        if group_low is not None and group_high is not None:
            return [{
                "service": SERVICE_SET_TEMPERATURE,
                "kwargs": dict(group_band),
                "raw_kwargs": dict(group_band),
                "entity_ids": entity_ids,
            }]

        return self._complete_bounds_per_entity(entity_ids, group_band)

    def _complete_bounds_per_entity(
        self, entity_ids: list[str], group_band: dict[str, float | None]
    ) -> list[dict[str, Any]]:
        """Complete a half-open group band per entity ("leave the rest as it is").

        Only reached when `target_state` carries just one bound. The missing
        bound is taken from the member's own current state (for a covered
        member, its template-rendered range), with the template's cached band as
        the fallback. A covered member's kwargs are replaced by the range
        translation anyway; a non-covered member for which the bound stays
        unresolvable yields no call rather than an invalid one.

        The completed bound is marked `injected`: it is schema padding taken
        from the member, not a group target, and `target_state` carries None for
        it by definition. Without the marker the staleness check reads that None
        as "deliberately cleared" and discards the whole batch, so a command on
        the bound the group *does* hold would never reach the members. Only the
        completed bound is marked — the commanded one must stay checkable.
        """
        template = self._group.member_template_manager.range_template
        group_low = group_band[ATTR_TARGET_TEMP_LOW]
        group_high = group_band[ATTR_TARGET_TEMP_HIGH]

        calls = []
        for entity_id in entity_ids:
            member_state = self._group.aggregator.read_member_state(entity_id)
            member_attrs = member_state.attributes if member_state else {}
            entity_low = group_low if group_low is not None else member_attrs.get(ATTR_TARGET_TEMP_LOW)
            entity_high = group_high if group_high is not None else member_attrs.get(ATTR_TARGET_TEMP_HIGH)

            is_covered = bool(template and template.covers(entity_id))
            if is_covered:
                # A covered member is emitted even with an unresolved bound: the
                # range-template stage replaces these kwargs with a physical
                # single-setpoint command anyway, so no invalid call goes out.
                entity_low = entity_low if entity_low is not None else template.low
                entity_high = entity_high if entity_high is not None else template.high
            elif entity_low is None or entity_high is None:
                continue

            injected = [
                attr for attr, group_value in (
                    (ATTR_TARGET_TEMP_LOW, group_low),
                    (ATTR_TARGET_TEMP_HIGH, group_high),
                ) if group_value is None
            ]

            calls.append({
                "service": SERVICE_SET_TEMPERATURE,
                "kwargs": {ATTR_TARGET_TEMP_LOW: entity_low, ATTR_TARGET_TEMP_HIGH: entity_high},
                "raw_kwargs": dict(group_band),
                "entity_ids": [entity_id],
                "injected": injected,
            })
        return calls

    def _get_call_entity_ids(self, attr: str, value: Any = None) -> list[str]:
        """Get entity IDs for a given attribute and target value.

        Delegates to _get_filtered_entities, which applies capability check,
        _block_unsynced_entity hook, and optionally value diffing (_should_diff).
        """
        return self._get_filtered_entities(attr, value)

    def _split_calls_by_entity(self, calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Split bundled calls into per-entity calls to allow a delay between them."""
        result = []
        for call in calls:
            for entity_id in call["entity_ids"]:
                result.append({**call, "entity_ids": [entity_id]})
        return result

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Get the target value for an attribute.

        Default: return the explicitly passed value (used by direct command handlers).
        Override in Sync/Schedule handlers to read from target_state instead.
        """
        return value

    def _get_target_value_with_offset(self, attr: str, value: Any = None) -> Any:  # noqa: ARG002
        """Read from target_state, with group_offset applied for temperature attributes.

        Rounding is unconditional, also at offset 0.0: devices round to one
        decimal themselves, so an unrounded target diffs against the value they
        report back and fires a redundant call on every resync. Do not make it
        conditional to match the call path.

        `value` is unused — handlers routing here always want the group target.
        """
        raw = getattr(self.target_state, attr, None)
        if raw is not None and attr in TEMP_TARGET_ATTRS:
            return round(float(raw) + self._group.run_state.group_offset, 1)
        return raw

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Check if a specific member should be excluded from service calls.

        Combines global block (e.g. window open) and per-member isolation
        (e.g. curtain closed). Returns True if either applies.
        Override in derived handlers that bypass all blocking (e.g. IsolationCallHandler).
        """
        run_state = self._group.run_state
        if run_state.blocked:
            _LOGGER.debug("[%s] Member %s blocked (blocking_sources=%s)", self._group.entity_id, entity_id, run_state.blocking_sources)
            return True
        if entity_id in run_state.isolated_members:
            _LOGGER.debug("[%s] Member %s blocked (isolated)", self._group.entity_id, entity_id)
            return True
        return False

    def _is_oob_blocked(self, entity_id: str) -> bool:
        """Check if a member is blocked due to being out-of-bounds (OOB).

        If target_state has drifted back into range, the member is unblocked
        so _process_oob_guard can restore it.
        """
        if entity_id in self._group.run_state.oob_members:
            # Check if current target_state would STILL put it OOB.
            # If target_state is now valid, unblock it so it can receive the call & restore.
            temp_attrs = TEMP_TARGET_ATTRS
            active_temps = [
                getattr(self.target_state, attr) for attr in temp_attrs
                if getattr(self.target_state, attr) is not None
            ]

            if not active_temps:
                return False  # Targets cleared -> no longer OOB

            if (state := available_state(self._group.aggregator.read_member_state(entity_id))) is None:
                return True  # Device unavailable -> keep blocked

            min_temp = state.attributes.get("min_temp")
            max_temp = state.attributes.get("max_temp")
            member_offset = self._group._temp_offset_map.get(entity_id, 0.0)
            group_offset = self._group.run_state.group_offset

            for target_temp in active_temps:
                effective_tgt = target_temp + member_offset + group_offset
                if (min_temp is not None and effective_tgt < min_temp) or \
                   (max_temp is not None and effective_tgt > max_temp):
                    return True  # Still OOB -> keep blocked

            return False  # In range! Remove block so _process_oob_guard can clear it.

        return False

    def _get_capable_entities(self, attr: str, value: Any = None) -> list[str]:
        """Get members that technically support this attribute/value (Capability check).

        For mode attributes (hvac_mode, fan_mode, preset_mode, swing_mode):
            With value: checks if value is in the device's supported modes list.
            Without value: checks only that the modes list attribute exists and is non-empty.
            Exception for hvac_mode without value: missing modes list is tolerated
            (some devices don't advertise hvac_modes but still accept mode commands).
        For float attributes (temperature, humidity, etc.):
            value is not meaningful for capability — only checks attribute existence.

        Args:
            attr: The attribute to check capability for.
            value: Target value. Used for mode attributes only — ignored for float attributes.
        """
        entity_ids = []
        for entity_id in self._group.climate_entity_ids:
            if self._is_member_blocked(entity_id):
                continue

            if (state := available_state(self._group.aggregator.read_member_state(entity_id))) is None:
                continue
            if attr in MODE_MODES_MAP:
                supported_modes = state.attributes.get(MODE_MODES_MAP[attr], [])
                if value is not None:
                    if attr == ATTR_HVAC_MODE:
                        # hvac_mode exception: devices that don't advertise hvac_modes are
                        # assumed to accept all mode commands (no constraint known).
                        if supported_modes and value not in supported_modes:
                            continue
                    else:
                        if value not in supported_modes:
                            continue
                elif attr != ATTR_HVAC_MODE and not supported_modes:
                    continue
            elif attr not in state.attributes:
                continue
            entity_ids.append(entity_id)
        return entity_ids

    def _get_filtered_entities(self, attr: str, value: Any = None) -> list[str]:
        """Get members that should receive a call for this attribute.

        Unified entity selection pipeline used by all handlers:
        1. Capability check via _get_capable_entities (with target value for mode attrs).
        2. _block_unsynced_entity hook (e.g. skip OFF members for Partial Sync).
        3. Value diffing — skipped when _should_diff() returns False (ClimateCallHandler).

        Args:
            attr: The attribute to check.
            value: Explicit value (used by ClimateCallHandler via _get_target_value override).
        """
        result = []

        target_value = self._get_target_value(attr, value)
        if target_value is None:
            return []

        for entity_id in self._get_capable_entities(attr, target_value):
            if (state := available_state(self._group.aggregator.read_member_state(entity_id))) is None:
                continue

            if attr in TEMP_TARGET_ATTRS:
                member_offset = self._group._temp_offset_map.get(entity_id, 0.0)
                effective_target = target_value + member_offset if target_value is not None else None
            else:
                effective_target = target_value

            current_value = state.state if attr == ATTR_HVAC_MODE else state.attributes.get(attr)

            # Output Filter hook (e.g. Partial Sync: skip OFF members)
            if self._block_unsynced_entity(attr, effective_target, state):
                _LOGGER.debug("[%s] Skipping member %s", self._group.entity_id, entity_id)
                continue

            if not self._should_diff():  # default: skip diffing
                result.append(entity_id)
                continue

            # Float tolerance check
            if attr in (ATTR_TEMPERATURE, ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH, ATTR_HUMIDITY):
                if within_tolerance(current_value, effective_target):
                    continue
            if attr in (ATTR_TARGET_TEMP_LOW, ATTR_TARGET_TEMP_HIGH):
                if self._group.member_template_manager.setpoint_in_reach(state, current_value, effective_target):
                    continue

            if current_value != effective_target:
                result.append(entity_id)

        return result

    def _should_diff(self) -> bool:
        """Whether _get_filtered_entities should filter by value deviation.

        Default: True unless CONF_FORCE_RETRY is enabled, in which case all capable
        entities are included regardless of current value.
        Override to False in handlers that must always send regardless of this option
        (ClimateCallHandler, SwitchCallHandler).
        """
        return not self._group.config.get(CONF_FORCE_RETRY, False)

    def _get_parent_id(self) -> str:
        """Create a unique Parent ID for echo tracking.

        Format: "OriginEntityID|Timestamp"
        - OriginEntityID: The entity that triggered the change (primary, for "Sender Wins" logic)
        - Timestamp: When the command was sent (secondary, for stale echo detection)
        """
        origin_entity = self.target_state.last_entity or ""
        timestamp = str(time.time())
        return f"{origin_entity}|{timestamp}"

    def _build_initial_call(self, attr: str, value: Any, entity_ids: list[str]) -> list[dict[str, Any]]:
        """Build a simple initial call dict from attr/value. No feature logic."""
        service = ATTR_SERVICE_MAP.get(attr)
        if not service:
            return []
        return [{"service": service, "kwargs": {attr: value}, "entity_ids": entity_ids}]

    def _process_unsupported_hvac(self, calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Union strategy: handle members that don't support the requested HVAC mode."""
        if self._group.config.get(CONF_FEATURE_STRATEGY) != FeatureStrategy.UNION:
            return calls

        action = self._group.config.get(CONF_UNION_UNSUPPORTED_HVAC_ACTION, UnsupportedHvacAction.IGNORE)

        # Determine target mode: from call (if present) or current target_state
        hvac_call = next((call for call in calls if ATTR_HVAC_MODE in call["kwargs"]), None)
        target_mode = hvac_call["kwargs"][ATTR_HVAC_MODE] if hvac_call else self.target_state.hvac_mode

        if not target_mode or target_mode == HVACMode.OFF:
            return calls

        # Identify members that technically do not support the target mode
        unsupported = {
            entity_id for entity_id in self._group.climate_entity_ids
            if (state := available_state(self._group.aggregator.read_member_state(entity_id)))
            and (modes := state.attributes.get(ATTR_HVAC_MODES, []))
            and target_mode not in modes
        }

        if not unsupported:
            return calls

        # Filter unsupported members out of all existing calls (e.g. temperature)
        filtered = [
            {**call, "entity_ids": [entity_id for entity_id in call["entity_ids"] if entity_id not in unsupported]}
            for call in calls
        ]

        # For explicit HVAC_MODE changes, turn unsupported members OFF if configured
        if hvac_call and action == UnsupportedHvacAction.OFF:
            for entity_id in unsupported:
                state = available_state(self._group.aggregator.read_member_state(entity_id))
                if state and state.state != HVACMode.OFF and not self._is_member_blocked(entity_id):
                    filtered.append({
                        "service": SERVICE_SET_HVAC_MODE,
                        "kwargs": {ATTR_HVAC_MODE: HVACMode.OFF},
                        "entity_ids": [entity_id],
                        "injected": [ATTR_HVAC_MODE],
                    })

        return [call for call in filtered if call["entity_ids"]]

    def _process_min_temp_off(self, calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Handle min_temp_off: restructure HVAC_MODE calls for temp-capable devices.

        - OFF: split into temp-capable (SET_TEMPERATURE with min_temp + OFF) and
          non-temp (SET_HVAC_MODE OFF)
        - Restore (ON): inject the setpoint for temp-capable devices, so a device
          parked at its min_temp does not come back on 5°
        - Non-applicable calls pass through unchanged.
        """
        if not self._group.min_temp_off:
            return calls  # Feature not active → No-Op

        result = []
        for call in calls:
            kwargs = call["kwargs"]

            # Only process HVAC_MODE calls
            if ATTR_HVAC_MODE not in kwargs or call["service"] != SERVICE_SET_HVAC_MODE:
                result.append(call)
                continue

            hvac_mode = kwargs[ATTR_HVAC_MODE]
            entity_ids = call["entity_ids"]

            # Entity split: temp-capable vs. non-temp devices. Only a single
            # setpoint counts — HA rejects `temperature` on a range-only entity,
            # so such a member must take the plain set_hvac_mode branch.
            temp_ids = [
                entity_id for entity_id in entity_ids
                if (state := self._group.aggregator.read_member_state(entity_id)) and ATTR_TEMPERATURE in state.attributes
            ]
            non_temp_ids = [entity_id for entity_id in entity_ids if entity_id not in temp_ids]

            if hvac_mode == HVACMode.OFF:
                # OFF: each temp-capable device gets its own min_temp
                for entity_id in temp_ids:
                    state = self._group.aggregator.read_member_state(entity_id)
                    device_min = state.attributes.get("min_temp", DEFAULT_MIN_TEMP) if state else DEFAULT_MIN_TEMP
                    result.append({
                        **call,
                        "service": SERVICE_SET_TEMPERATURE,
                        "kwargs": {ATTR_TEMPERATURE: device_min, ATTR_HVAC_MODE: HVACMode.OFF},
                        "entity_ids": [entity_id],
                        "injected": list(set(call.get("injected", [])) | {ATTR_TEMPERATURE}),
                    })
                if non_temp_ids:
                    result.append({
                        **call,
                        "service": SERVICE_SET_HVAC_MODE,
                        "kwargs": {ATTR_HVAC_MODE: HVACMode.OFF},
                        "entity_ids": non_temp_ids,
                    })
            else:
                # Restore (turning ON): inject the setpoint for temp-capable devices
                # (see docstring).
                target_temp = self._min_temp_off_restore_value()
                if target_temp is not None and temp_ids:
                    result.append({
                        **call,
                        "service": SERVICE_SET_TEMPERATURE,
                        "kwargs": {ATTR_TEMPERATURE: target_temp, ATTR_HVAC_MODE: hvac_mode},
                        "entity_ids": temp_ids,
                    })
                if non_temp_ids or (target_temp is None and temp_ids):
                    result.append({
                        **call,
                        "service": SERVICE_SET_HVAC_MODE,
                        "kwargs": {ATTR_HVAC_MODE: hvac_mode},
                        "entity_ids": non_temp_ids + (temp_ids if target_temp is None else []),
                    })

        return result

    def _process_member_offset(self, calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Apply per-entity temperature offset.

        For calls with temperature kwargs that are not already injected,
        apply the configured offset. Members with offset are split into
        per-entity calls; members without offset are batched together.

        Uses "member_offset_applied" (not "injected") so that _process_group_offset
        can still add the global offset on top. Both offsets are additive.
        """
        if not self._group.has_member_offset:
            return calls  # No-op when every configured offset is 0.0

        result = []
        temp_attrs = TEMP_TARGET_ATTRS

        for call in calls:
            kwargs = call["kwargs"]
            injected = set(call.get("injected", []))
            # Only transform temp attrs that are not already injected (e.g. min_temp_off)
            transformable = temp_attrs & set(kwargs) - injected

            if not transformable:
                result.append(call)
                continue

            # Preserve raw (pre-offset) values so downstream stages (range template
            # cache, stale-call guard) can access the original intent.
            raw_kwargs = {attr: kwargs[attr] for attr in transformable}

            # Split by offset: batch no-offset entities, per-entity for offset
            no_offset_ids = []
            for entity_id in call["entity_ids"]:
                member_offset = self._group._temp_offset_map.get(entity_id, 0.0)
                if member_offset == 0.0:
                    no_offset_ids.append(entity_id)
                    continue

                adjusted_kwargs = dict(kwargs)
                for attr in transformable:
                    if adjusted_kwargs[attr] is not None:
                        adjusted_kwargs[attr] = round(float(adjusted_kwargs[attr]) + member_offset, 1)

                result.append({
                    **call,
                    "kwargs": adjusted_kwargs,
                    "entity_ids": [entity_id],
                    "member_offset_applied": list(transformable),
                    "raw_kwargs": raw_kwargs,
                })

            if no_offset_ids:
                result.append({**call, "entity_ids": no_offset_ids})

        return result

    def _process_group_offset(self, calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Shift temperature attributes by the global group offset.

        Applies on top of any member_offset_applied values — both offsets are additive.
        Only skips attrs listed in "injected" (min_temp_off, OOB-clamp) which must not
        be modified further.
        """
        if not self._apply_group_offset():
            return calls

        group_offset = self._group.run_state.group_offset
        if group_offset == 0.0:
            return calls

        result = []
        temp_attrs = TEMP_TARGET_ATTRS

        for call in calls:
            kwargs = call["kwargs"]
            injected = set(call.get("injected", []))
            # Only skip "injected" (min_temp_off / OOB-clamp) — member_offset_applied passes through
            transformable = temp_attrs & set(kwargs) - injected

            if not transformable:
                result.append(call)
                continue

            # Preserve pre-offset values for downstream consumers (range template
            # cache) — if _process_member_offset already set raw_kwargs, keep it as
            # the single source of truth; otherwise seed it from the current
            # (still offset-free at this point) kwargs before applying group_offset.
            raw_kwargs = dict(call.get("raw_kwargs", {}))
            for attr in transformable:
                raw_kwargs.setdefault(attr, kwargs[attr])

            adjusted_kwargs = dict(kwargs)
            for attr in transformable:
                if adjusted_kwargs[attr] is not None:
                    adjusted_kwargs[attr] = round(float(adjusted_kwargs[attr]) + group_offset, 1)

            result.append({
                **call,
                "kwargs": adjusted_kwargs,
                "raw_kwargs": raw_kwargs,
                "injected": list(injected | transformable),
            })

        return result

    def _process_range_template(self, calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Translate outgoing range commands into physical single-setpoint commands.

        The output half of the Range Template. For each call addressing
        template-covered members:
          - non-range calls (e.g. `hvac_mode=off`, preset, fan) pass through;
          - range calls (`target_temp_low/high` or `hvac_mode=heat_cool`) are
            translated per member based on its `current_temperature` —
            `heat`+`low`, `cool`+`high`, or the configured deadband action;
          - native members in the same call are emitted unchanged in a
            separate output call;
          - translated payloads are bucketed by `(service, kwargs)` so members
            with identical decisions ship in one call.

        This is the only pipeline stage that may *increase* `len(calls)`. The
        `target_temp_low/high` from the incoming call is cached on the template
        so a follow-up `hvac_mode=heat_cool` (without explicit setpoints) can
        still resolve a band. Outputs carry `injected=[ATTR_TEMPERATURE,
        ATTR_HVAC_MODE]` so `_is_stale_call` does not discard them as
        deviations from `target_state`.
        """
        template = self._group.member_template_manager.range_template
        if template is None:
            return calls

        result = []
        for call in calls:
            entity_ids = call["entity_ids"]
            kwargs = call["kwargs"]

            template_members = [entity_id for entity_id in entity_ids if template.covers(entity_id)]
            if not template_members:
                result.append(call)
                continue

            is_range_call = (
                ATTR_TARGET_TEMP_LOW in kwargs
                or ATTR_TARGET_TEMP_HIGH in kwargs
                or kwargs.get(ATTR_HVAC_MODE) == HVACMode.HEAT_COOL
            )

            if not is_range_call:
                result.append(call)
                continue

            # Cache the commanded range so later hvac_mode=heat_cool without
            # explicit setpoints can still resolve a band. Use raw_kwargs
            # (pre-offset values) when available — member offsets must not
            # contaminate the template cache.
            cache_kwargs = call.get("raw_kwargs", kwargs)
            if ATTR_TARGET_TEMP_LOW in cache_kwargs and cache_kwargs[ATTR_TARGET_TEMP_LOW] is not None:
                template.low = float(cache_kwargs[ATTR_TARGET_TEMP_LOW])
            if ATTR_TARGET_TEMP_HIGH in cache_kwargs and cache_kwargs[ATTR_TARGET_TEMP_HIGH] is not None:
                template.high = float(cache_kwargs[ATTR_TARGET_TEMP_HIGH])

            # resolve_range() already applies the right precedence per bound
            # (target_state first, template cache as its own fallback) — a
            # one-sided command caches only its own bound, so the other one
            # must still come from target_state (e.g. adopted via MIRROR)
            # instead of falling through to the +/-5 seed below.
            low_val, high_val = self._group.member_template_manager.resolve_range()

            # Native members keep the original payload in a separate call.
            native_members = [entity_id for entity_id in entity_ids if entity_id not in template_members]
            if native_members:
                result.append({**call, "entity_ids": native_members})

            if low_val is None or high_val is None:
                if self._group._attr_target_temperature is None:
                    continue
                target_temp = float(self._group._attr_target_temperature)
                low_val = target_temp - 5
                high_val = target_temp + 5
                # Deliberate exception to the StateManager pattern: this is
                # pipeline-internal band seeding, not a source-attributable event — there is
                # no meaningful "last_source" for it, so it bypasses StateManager.update()
                # and writes target_temp_low/high directly without touching last_source/
                # last_entity/last_timestamp (those keep reflecting the actual command that
                # triggered this call). Idempotent: the seed lands in target_state, and a
                # retry resolves it from there via resolve_range() instead of seeding again.
                self._group.shared_target_state = self._group.shared_target_state.update(
                    target_temp_low=low_val,
                    target_temp_high=high_val,
                )

            # Bucket per-member translations by (service, kwargs) so identical
            # decisions ship as a single call.
            bundled: dict[tuple[str, frozenset[tuple[str, Any]]], list[str]] = {}

            for entity_id in template_members:
                # Deliberately hass.states.get(), not read_member_state(): the
                # translation needs the member's actual physical mode/temperature
                # to decide the outgoing single-setpoint command, not the virtual
                # heat_cool proxy read_member_state() would return for a covered
                # member.
                state = self._hass.states.get(entity_id)
                if not state:
                    continue
                current_temp = self._group.member_template_manager._read_current_temp(state)
                supported_modes = state.attributes.get(ATTR_HVAC_MODES)
                # The raw band (cache / target_state) carries no offsets — re-apply
                # the member's per-entity offset and the handler's group offset so
                # covered members receive the same physical setpoint the native
                # members get from the offset-applied kwargs.
                member_offset = self._group._temp_offset_map.get(entity_id, 0.0)
                group_offset = self._group.run_state.group_offset if self._apply_group_offset() else 0.0
                offset = member_offset + group_offset
                expected_mode, expected_temp = self._group.member_template_manager.expected_mode_for(
                    entity_id, low_val + offset, high_val + offset, current_temp, supported_modes
                )

                if expected_mode is None:
                    # No mode is due, but a member left running in heat/cool
                    # regulates to its own setpoint — hold it on that mode's band
                    # edge, or a moved band leaves it heating/cooling towards the
                    # old one. A role-forbidden mode is left alone.
                    edges = {HVACMode.HEAT: low_val + offset, HVACMode.COOL: high_val + offset}
                    if state.state not in edges or not self._group.member_template_manager.mode_allowed(
                        state.state, supported_modes, entity_id
                    ):
                        continue
                    expected_mode, expected_temp = state.state, edges[state.state]

                # Track the active heating/cooling mode for the fallback in
                # _expected_mode_for() when current_temperature later goes missing.
                # Deadband and humidity action are not tracked — they are not active heating/cooling.
                if expected_mode in (HVACMode.HEAT, HVACMode.COOL):
                    template.last_physical_mode[entity_id] = expected_mode

                trans_kwargs: dict[str, Any]
                if expected_mode in (HVACMode.OFF, HVACMode.FAN_ONLY) or expected_temp is None:
                    trans_service = SERVICE_SET_HVAC_MODE
                    trans_kwargs = {ATTR_HVAC_MODE: expected_mode}
                else:
                    trans_service = SERVICE_SET_TEMPERATURE
                    trans_kwargs = {
                        ATTR_HVAC_MODE: expected_mode,
                        ATTR_TEMPERATURE: expected_temp,
                    }

                # Carry through orthogonal mode attributes from the original call.
                passthrough_keys = {"preset_mode", "fan_mode", "swing_mode", "swing_horizontal_mode"}
                for pk in passthrough_keys:
                    if pk in kwargs:
                        trans_kwargs[pk] = kwargs[pk]

                kw_set = frozenset(trans_kwargs.items())
                bundled.setdefault((trans_service, kw_set), []).append(entity_id)

            for (trans_service, kw_set), bundle_ids in bundled.items():
                # Mark translated attrs as injected so _is_stale_call does not
                # reject them for diverging from target_state.
                injected = list(call.get("injected", []))
                for key in (ATTR_TEMPERATURE, ATTR_HVAC_MODE):
                    if key not in injected:
                        injected.append(key)

                result.append({
                    "service": trans_service,
                    "kwargs": dict(kw_set),
                    "entity_ids": bundle_ids,
                    "injected": injected,
                })

        return result

    def _process_oob_guard(self, calls: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """OOB guard: check if temperature values are within device range (union only).

        Checks ALL calls with ATTR_TEMPERATURE kwargs against device min/max.
        Preserves upstream kwargs (e.g. hvac_mode from min_temp_off restore).

        Side-effect free: the members this pass found out of bounds are collected
        in `self._pending_oob` instead of being written to run_state here. Call
        generation must not mark a member OOB before the corresponding OFF/CLAMP
        call actually went out — `_execute_calls` may still discard the whole
        batch as stale, which would leave the member excluded from later syncs
        without ever having been acted on. `_execute_calls` applies the marking
        once the calls have been sent.
        """
        if self._group.config.get(CONF_FEATURE_STRATEGY) != FeatureStrategy.UNION:
            return calls  # No-op when not union strategy

        result = []
        action = self._group.config.get(CONF_UNION_OUT_OF_BOUNDS_ACTION, UnionOutOfBoundsAction.OFF)

        temp_attrs = TEMP_TARGET_ATTRS

        for call in calls:
            kwargs = call["kwargs"]

            # Intercept any temperature-altering attributes
            call_temp_attrs = {attr: kwargs[attr] for attr in temp_attrs if attr in kwargs}
            if not call_temp_attrs:
                result.append(call)
                continue

            upstream_kwargs = {key: value for key, value in kwargs.items() if key not in temp_attrs}

            in_range_ids = []
            for entity_id in call["entity_ids"]:
                state = available_state(self._group.aggregator.read_member_state(entity_id))
                if not state:
                    continue

                min_temp = state.attributes.get("min_temp")
                max_temp = state.attributes.get("max_temp")

                is_oob = False
                for attr, value in call_temp_attrs.items():
                    if (min_temp is not None and value < min_temp) or \
                       (max_temp is not None and value > max_temp):
                        is_oob = True
                        break

                if is_oob:
                    # → OOB
                    self._pending_oob_add.add(entity_id)
                    self._pending_oob_discard.discard(entity_id)
                    if action == UnionOutOfBoundsAction.OFF:
                        if state.state != HVACMode.OFF:
                            result.append({
                                "service": SERVICE_SET_HVAC_MODE,
                                "kwargs": {ATTR_HVAC_MODE: HVACMode.OFF},
                                "entity_ids": [entity_id],
                                "injected": [ATTR_HVAC_MODE],
                            })
                    else:  # CLAMP
                        clamped_kwargs = {**upstream_kwargs}
                        for attr, value in call_temp_attrs.items():
                            clamped = value
                            if min_temp is not None and value < min_temp:
                                clamped = min_temp
                            elif max_temp is not None and value > max_temp:
                                clamped = max_temp
                            clamped_kwargs[attr] = clamped

                        result.append({
                            **call,
                            "service": SERVICE_SET_TEMPERATURE,
                            "kwargs": clamped_kwargs,
                            "entity_ids": [entity_id],
                            "injected": list(set(call.get("injected", [])) | call_temp_attrs.keys()),
                        })
                else:
                    # → In-range for THIS call's attributes. That is not enough to
                    # clear the marking: a member out of bounds only on
                    # target_temp_low would be released by a temperature-only call
                    # and re-marked by the next range call, flip-flopping every
                    # sync cycle. `_is_oob_blocked` weighs every bound the target
                    # state currently carries — reuse it as the single authority.
                    in_range_ids.append(entity_id)
                    if entity_id in self._group.run_state.oob_members and not self._is_oob_blocked(entity_id):
                        if state.state == HVACMode.OFF:
                            target_mode = self.target_state.hvac_mode
                            if target_mode and target_mode != HVACMode.OFF:
                                capable = self._get_capable_entities(ATTR_HVAC_MODE, target_mode)
                                if entity_id in capable:
                                    result.append({
                                        "service": SERVICE_SET_HVAC_MODE,
                                        "kwargs": {ATTR_HVAC_MODE: target_mode},
                                        "entity_ids": [entity_id],
                                    })
                        self._pending_oob_discard.add(entity_id)
                        self._pending_oob_add.discard(entity_id)

            if in_range_ids:
                result.append({
                    **call,
                    "kwargs": {**call_temp_attrs, **upstream_kwargs},
                    "entity_ids": in_range_ids,
                })

        return result

    # Setpoint source for the min_temp_off restore
    def _min_temp_off_restore_value(self) -> float | None:
        """Setpoint the min_temp_off restore branch sends when turning a device on.

        An active boost wins over `target_state`: it owns the members while it
        runs and deliberately never writes the target, so the stored value is the
        pre-boost one. Sent here it would land on the device *after* the boost's
        own call — waking an OFF group sends temperature and mode together — and
        the boost would be overwritten by the setpoint it just replaced.
        """
        if (boost_temp := self._group.run_state.boost_temperature) is not None:
            return boost_temp
        return self.target_state.temperature

    # Group offset hook
    def _apply_group_offset(self) -> bool:
        """Whether to apply the global group offset. False by default (direct-command handlers)."""
        return False

    # OOB marking write-back, after the calls went out
    def _apply_pending_oob(self, sent_entity_ids: set[str] | None = None) -> None:
        """Write the OOB marking collected during call generation to run_state.

        Called by `_execute_calls` after the generated calls have been sent, so a
        batch discarded as stale never leaves a member marked OOB without the
        corresponding OFF/CLAMP call having gone out. Read-modify-write is atomic
        (no await), and the pending sets are cleared for the next generation.

        `sent_entity_ids`, when given, restricts the marking to entities whose
        call actually went out — used by the mid-batch stale abort, where later
        calls in the same batch never reached their entities and must not be
        marked based on a generation-time decision that was never executed.
        """
        if not self._pending_oob_add and not self._pending_oob_discard:
            return
        # Copy before clearing — pending_add/pending_discard would otherwise be
        # the same set objects as self._pending_oob_add/_discard and go empty
        # along with them below.
        pending_add = set(self._pending_oob_add)
        pending_discard = set(self._pending_oob_discard)
        if sent_entity_ids is not None:
            pending_add &= sent_entity_ids
            pending_discard &= sent_entity_ids
        self._pending_oob_add.clear()
        self._pending_oob_discard.clear()
        if not pending_add and not pending_discard:
            return
        run_state = self._group.run_state
        new_oob = (run_state.oob_members | pending_add) - pending_discard
        if new_oob != run_state.oob_members:
            self._group.run_state = replace(run_state, oob_members=frozenset(new_oob))

    # Block hook to prevent all service calls
    def _block_all_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> bool:
        """Hook for derived classes to implement custom call blocking logic.
        Returns:
            bool: True if calls should be blocked, False otherwise.
        """
        return False

    # Block hook to prevent service calls to specific attributes
    def _block_call_attr(self, data: dict[str, Any], attr: str) -> bool:
        """Block calls for specific attributes."""
        return self._block_wakeup_calls(data, attr)

    # Wake-up prevention for setpoints the requested mode makes pointless
    def _block_wakeup_calls(self, data: dict[str, Any], attr: str) -> bool:
        """Block calls for specific attributes based on requested HVAC mode.

        1. Prevent all setpoint changes if requested HVAC mode is OFF (Wake-up prevention).
        2. Prevent single setpoint changes if requested HVAC mode is AUTO or HEAT_COOL
           (Dynamic modes where single setpoints are often irrelevant or stale).
        3. Prevent range setpoint changes if requested HVAC mode is AUTO.
        """
        if attr == ATTR_HVAC_MODE:
            return False

        requested_hvac_mode = data.get(ATTR_HVAC_MODE)
        if requested_hvac_mode == HVACMode.OFF:
            return True

        if requested_hvac_mode == HVACMode.AUTO:
            return attr in TEMP_TARGET_ATTRS

        if requested_hvac_mode == HVACMode.HEAT_COOL:
            return attr == ATTR_TEMPERATURE

        return False

    # Stale call guard hook
    def _is_stale_call(self, call: dict[str, Any]) -> bool:
        """Return True if this call is stale and should be aborted.

        Called before each individual service call inside the retry loop.
        Default: never stale — handlers that operate on live target_state diffs
        (SyncCallHandler, ScheduleCallHandler) are always current by design.

        Override in handlers that carry a fixed data snapshot from the moment
        the user command was issued (e.g. ClimateCallHandler), where a newer
        command may have changed target_state while a blocking call was running.
        """
        return False

    # Block hook for unsynced entities
    def _block_unsynced_entity(self, attr: str, target_value: Any, state: State) -> bool:
        """Check if this entity should be skipped. Default: no filtering."""
        return False

    # Partial-sync check behind the unsynced-entity hook
    def _skip_off_member(self, state: State, target_value: Any) -> bool:
        """Return True if this OFF member should be skipped for an "on" target (Partial Sync)."""
        if self.target_state.hvac_mode == HVACMode.OFF:
            return False
        if target_value == HVACMode.OFF:
            return False
        if state.state != HVACMode.OFF:
            return False
        return True

    async def _after_call_trigger(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> None:
        """Hook called after a successful service call batch. No-op by default.

        Override in handlers that need to react after the call completes
        (e.g. ClimateCallHandler resets the group offset on manual setpoint changes).
        Must be async — the base implementation is a no-op coroutine so that all
        subclasses can be awaited uniformly without 'await None' footguns.
        """
        pass


class ClimateCallHandler(BaseServiceCallHandler):
    """Handler for direct user commands (set_hvac_mode, set_temperature, etc.).

    Carries the exact attributes the user changed as a fixed data snapshot and
    forwards them to all members. Because the snapshot is frozen at command time,
    this handler implements `_is_stale_call` to abort if target_state has moved
    on before a blocking call completes (race condition with rapid UI input).

    Blocking:
    - Setpoint changes are blocked when Window Control / force_off is active.
    - HVAC mode changes always bypass the block (turning the group OFF must work
      even when a window is open).
    """

    CONTEXT_ID = "group"

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the climate call handler."""
        super().__init__(group)
        self._turning_off = False
        self._dispatched_data: dict[str, Any] | SyncTarget | None = None

    def _generate_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate calls for user operations."""
        if data is SYNC_TARGET or not data:
            return []
        self._turning_off = data.get(ATTR_HVAC_MODE) == HVACMode.OFF
        if self._turning_off and self._group.run_state.blocked:
            # Only the OFF command itself may pass the block — other attributes
            # in a combined payload (e.g. set_temperature with hvac_mode: off)
            # must not reach members while a blocking source is active.
            data = {ATTR_HVAC_MODE: HVACMode.OFF}
        # Record what actually goes out: _after_call_trigger() is handed the
        # original payload by the retry loop and must not act on attributes
        # that were stripped here.
        self._dispatched_data = data
        try:
            return super()._generate_calls(data=data, filter_state=filter_state)
        finally:
            self._turning_off = False

    def _should_diff(self) -> bool:
        return False

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Ignore the global block when turning the group off (isolation still applies).

        Turning the group OFF must reach members even while blocking_sources is
        active (e.g. window open) — see _block_all_calls below.
        """
        if self._turning_off:
            if entity_id in self._group.run_state.isolated_members:
                return True
            return False
        return super()._is_member_blocked(entity_id)

    def _block_all_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> bool:
        """Block calls if blocking mode is active, unless turning the group off."""
        blocked = self._group.run_state.blocked
        if data is not SYNC_TARGET and data.get(ATTR_HVAC_MODE) == HVACMode.OFF:
            if blocked:
                _LOGGER.debug("[%s] Bypass blocking mode (turning group off)", self._group.entity_id)
            return False
        return blocked

    def _is_stale_call(self, call: dict[str, Any]) -> bool:
        """Return True if any user-commanded attribute no longer matches target_state.

        Handles the race condition where a new UI command arrives while a previous
        blocking async_call is still running. In that window, target_state has
        already moved on, so the in-flight call would push the wrong state.

        Injected attributes (listed in call['injected']) are excluded from the
        staleness check — their values intentionally deviate from target_state.
        """
        target = self.target_state.to_dict()
        skip_attrs = set(call.get("injected", []))
        offset_attrs = set(call.get("member_offset_applied", []))
        raw_kwargs = call.get("raw_kwargs", {})
        _float_attrs = {"temperature", "humidity", "target_temp_low", "target_temp_high"}
        for attr, value in call["kwargs"].items():
            if attr in skip_attrs:
                continue
            if attr in offset_attrs:
                value = raw_kwargs.get(attr, value)
            # target_state.to_dict() excludes None values, so a cleared target
            # attribute is invisible to the value comparison below — check the
            # raw attribute instead: a None target means the value was
            # deliberately cleared (e.g. temperature after an AUTO switch) and
            # an in-flight call carrying the old value is stale.
            if getattr(self.target_state, attr, None) is None:
                return True
            t = target[attr]
            if attr in _float_attrs and isinstance(t, (int, float)) and isinstance(value, (int, float)):
                if abs(t - value) > FLOAT_TOLERANCE:
                    return True
            elif t != value:
                return True
        return False

    def _block_call_attr(self, data: dict[str, Any], attr: str) -> bool:
        """Do not block any attributes."""
        return False

    async def _after_call_trigger(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> None:
        """Execute calls and reset group offset if a temperature was explicitly set.

        The offset represents a manual nudge on top of the target; setting a
        temperature by hand replaces that intent, so the nudge is cleared. It
        must only be cleared for a temperature that actually went out: while a
        blocking source is active, `_generate_calls()` strips a combined
        `{temperature, hvac_mode: off}` down to a bare OFF. The retry loop still
        hands us the *original* payload here, so read what was dispatched
        instead — otherwise closing the window restores a target the user's
        offset no longer applies to.
        """
        effective = self._dispatched_data if self._dispatched_data is not None else data
        temp_attrs = TEMP_TARGET_ATTRS
        if (
            effective is not SYNC_TARGET
            and effective
            and temp_attrs & set(effective)
            and self._group.offset_set_callback
        ):
            await self._group.offset_set_callback(0.0)


class SyncCallHandler(BaseServiceCallHandler):
    """Generates calls based on target_state diff.

    Used when Sync Mode (Lock/Mirror) is active. Compares current member states
    against target_state and generates calls to sync deviations.

    Includes:
    - Blocking mode check
    - Partial sync output filter (don't wake OFF members)
    - Wake-up bug prevention
    """

    CONTEXT_ID = "sync_mode"

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the sync call handler."""
        super().__init__(group)

    def _generate_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET, filter_state: FilterState | None = None) -> list[dict[str, Any]]:
        """Generate calls based on target_state diff."""
        sync_handler = self._group.sync_mode_handler
        
        # MIRROR_LOCK enforces all attributes (deviating "locked" attributes are reverted)
        if sync_handler.sync_mode == SyncMode.MIRROR_LOCK:
            effective_filter = FilterState()  # All True
        else:
            # Dynamic filter state (respects schedule overrides)
            effective_filter = sync_handler.filter_state

        return super()._generate_calls(data=data, filter_state=effective_filter)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Extend base blocking with OOB check.

        OOB members are excluded from automatic syncs (SyncCallHandler) to
        prevent constant re-syncing of devices that intentionally deviate from
        target_state. ClimateCallHandler (base) does NOT override this, so
        direct user commands still reach OOB members and can clear their OOB state.
        """
        return super()._is_member_blocked(entity_id) or self._is_oob_blocked(entity_id)

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Read from target_state with group_offset applied for temperature attributes."""
        if self._apply_group_offset():
            return self._get_target_value_with_offset(attr, value)
        return getattr(self.target_state, attr, None)

    def _block_unsynced_entity(self, attr: str, target_value: Any, state: State) -> bool:  # noqa: ARG002
        """Apply Partial Sync (skip OFF members) AND exclude template-covered members.

        Covered members are owned by the Range Template — their changeover/correction
        is driven exclusively by the TemplateCallHandler, independent of sync_mode.
        Excluding them here prevents a double-drive when sync (LOCK/MIRROR_LOCK) is
        active. UI/Schedule/Boost/Template handlers do NOT override this hook, so
        legitimate heat_cool commands still reach covered members.
        """
        if self._group.member_template_manager.is_covered_state(state):
            return True
        if not self._group.config.get(CONF_IGNORE_OFF_MEMBERS_SYNC):
            return False
        return (
            self._skip_off_member(state=state, target_value=target_value)
            and bool(other_active_members(self._group, state.entity_id))
        )

    def _block_all_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> bool:
        """Block calls if blocking mode is active."""
        return self._group.run_state.blocked

    def _apply_group_offset(self) -> bool:
        # Suspended during temporary state (blocking sources or boost).
        return not self._group.run_state.temporary_state_active


class WindowControlCallHandler(BaseServiceCallHandler):
    """Call handler for Window Control operations.

    Bypasses member-level blocking so that window open/close commands
    always reach all members regardless of run_state state.
    """

    CONTEXT_ID = "window_control"

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the window control call handler."""
        super().__init__(group)
        self._debounce_delay = OVERRIDE_ENFORCE_DEBOUNCE_DELAY

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Bypass global block, but still respect per-member isolation."""
        return entity_id in self._group.run_state.isolated_members

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        # No block left: read target_state+offset so diff-check sees the same value members have.
        # While any block stands, use the value as-is — either the explicit window
        # payload, or a cascade restore whose target is sent unshifted (below).
        return self._get_target_value_with_offset(attr, value) if not self._group.run_state.blocking_sources else value

    def _apply_group_offset(self) -> bool:
        # Offset stays suspended while any block stands — this must match the
        # _get_target_value branch above, or the diff compares a shifted target
        # against an unshifted command and the member never counts as synced.
        return not self._group.run_state.blocking_sources


class PresenceCallHandler(BaseServiceCallHandler):
    """Call handler for Presence Control away-fallback operations.

    Bypasses member-level blocking so away commands always reach members
    regardless of run_state.blocked. Identical bypass profile to WindowControlCallHandler.
    """

    CONTEXT_ID = "presence"

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the presence call handler."""
        super().__init__(group)
        self._debounce_delay = OVERRIDE_ENFORCE_DEBOUNCE_DELAY

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Bypass global block, but still respect per-member isolation."""
        return entity_id in self._group.run_state.isolated_members

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        # No block left: read target_state+offset so diff-check sees the same value members have.
        # While any block stands, use the value as-is — either the explicit away
        # payload, or a cascade restore whose target is sent unshifted (below).
        return self._get_target_value_with_offset(attr, value) if not self._group.run_state.blocking_sources else value

    def _apply_group_offset(self) -> bool:
        # Offset stays suspended while any block stands — this must match the
        # _get_target_value branch above, or the diff compares a shifted target
        # against an unshifted command and the member never counts as synced.
        # Away payloads (AWAY_OFFSET etc.) already incorporate group_offset via _active_data().
        return not self._group.run_state.blocking_sources

    def _block_unsynced_entity(self, attr: str, target_value: Any, state: State) -> bool:  # noqa: ARG002
        """Leave a member the user switched off alone, per configured phase.

        Does not apply when the away payload switches the members off itself
        (`away_payload_switches_members_off`): then the group owns that `off` and
        must wake it on return — the state alone cannot tell a user's off from
        the group's.

        The phase comes from our *own* source rather than from
        `bool(blocking_sources)`: `restore()` unblocks first, so the away push and
        its enforcement see "presence" while the restore does not — and after the
        cascade rework a restore can run with another block still standing.

        No "is another member still running?" check here, unlike sync and
        schedule. Those turn every member off themselves and would strand an
        all-off group with no way back on; presence never does, so an all-off
        group is the user's own doing and stays off.
        """
        if self._group.presence_override_manager.away_payload_switches_members_off:
            return False

        mode = self._group.config.get(CONF_IGNORE_OFF_MEMBERS_PRESENCE, PresenceOffRespect.DISABLED)
        if mode == PresenceOffRespect.DISABLED:
            return False

        if "presence" in self._group.run_state.blocking_sources:  # away push
            if mode == PresenceOffRespect.HOME:
                return False
        elif mode == PresenceOffRespect.AWAY:                     # home restore
            return False

        return self._skip_off_member(state=state, target_value=target_value)


class ScheduleCallHandler(BaseServiceCallHandler):
    """Call handler for Schedule operations."""

    CONTEXT_ID = "schedule"

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the schedule call handler."""
        super().__init__(group)

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Extend base blocking with OOB check (same as SyncCallHandler)."""
        return super()._is_member_blocked(entity_id) or self._is_oob_blocked(entity_id)

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Read from target_state with group_offset applied for temperature attributes."""
        if self._apply_group_offset():
            return self._get_target_value_with_offset(attr, value)
        return getattr(self.target_state, attr, None)

    def _block_unsynced_entity(self, attr: str, target_value: Any, state: State) -> bool:  # noqa: ARG002
        """Apply Partial Sync: skip OFF members if CONF_IGNORE_OFF_MEMBERS_SCHEDULE is set."""
        if not self._group.config.get(CONF_IGNORE_OFF_MEMBERS_SCHEDULE):
            return False
        return (
            self._skip_off_member(state=state, target_value=target_value)
            and bool(other_active_members(self._group, state.entity_id))
        )

    def _block_all_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> bool:
        """Block schedule calls if a temporary state is active."""
        return self._group.run_state.temporary_state_active

    def _apply_group_offset(self) -> bool:
        # Suspended during temporary state (blocking sources or boost).
        return not self._group.run_state.temporary_state_active


class SwitchCallHandler(BaseServiceCallHandler):
    """Call handler for Main Switch operations (OFF / restore).

    Bypasses all blocking — switch is the master on/off and must always
    reach all members regardless of blocking_sources or isolated_members.
    """

    CONTEXT_ID = "switch"

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the switch call handler."""
        super().__init__(group)

    def _should_diff(self) -> bool:
        return False

    def _is_member_blocked(self, entity_id: str) -> bool:  # noqa: ARG002
        """Bypass all blocking — switch commands always reach every member."""
        return False

    def _apply_group_offset(self) -> bool:
        # Offset stays suspended while any block stands: the switch-OFF payload
        # {"hvac_mode": "off"} must not be shifted, and a restore that still has
        # another block behind it sends the plain target.
        return not self._group.run_state.blocking_sources


class SwitchEnforceCallHandler(BaseServiceCallHandler):
    """Call handler for Switch enforcement (deviating member correction).

    Bypass profile: ignores run_state.blocked, respects isolated_members.
    Isolated members were deliberately turned OFF — enforcement must not
    overwrite that. Distinct from SwitchCallHandler, which bypasses everything.
    """

    CONTEXT_ID = "switch_enforce"

    def __init__(self, group: ClimateGroupHelper):
        super().__init__(group)
        self._debounce_delay = OVERRIDE_ENFORCE_DEBOUNCE_DELAY

    def _should_diff(self) -> bool:
        return False

    def _is_member_blocked(self, entity_id: str) -> bool:
        return entity_id in self._group.run_state.isolated_members


class OverrideCallHandler(BaseServiceCallHandler):
    """Call handler for Override operations (boost).

    Diffing like ScheduleCallHandler, but:
    - context_id="override" (not "schedule")
    - no _block_all_calls: boost is already guarded in activate_boost()
    - no _block_unsynced_entity: OFF-member skipping is a future config option
    - no _is_oob_blocked pre-filter: that check compares target_state against the
      device limits, and a boost carries its own setpoint. A member marked OOB by
      an earlier target would be excluded from every boost, including one that
      lands inside its range. `_process_oob_guard` still runs at the end of the
      pipeline and judges the values actually being sent, so a boost that really
      is out of bounds for a device is handled there.
    """

    CONTEXT_ID = "override"

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the override call handler."""
        super().__init__(group)

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Use explicit passed value if available, otherwise read from target_state."""
        if value is not None:
            return value
        return getattr(self.target_state, attr, None)

    def _apply_group_offset(self) -> bool:
        # Suspended during temporary state (blocking sources or boost).
        return not self._group.run_state.temporary_state_active


class TemplateCallHandler(BaseServiceCallHandler):
    """Call handler that drives Member-Template-covered members (Range Template).

    The Range Template owns the full lifecycle of covered (single-setpoint) members:
    their physical mode (heat/cool/deadband) must always match
    `expected_mode_for(current_temperature, band)`. Any deviation — whether caused by
    a temperature crossing (auto-changeover) or a manual device change (correction) —
    is the same operation: re-send the group target (`heat_cool` + band), which the
    pipeline stage `_process_range_template` translates into the physical command.

    This handler is the *sole, intentional* driver of that changeover, independent of
    `sync_mode`. The `SyncCallHandler` excludes covered members (see its
    `_block_unsynced_entity`), so there is no double-drive when LOCK/MIRROR_LOCK is active.

    Profile: target-state based with diffing (only deviating covered members get a call),
    addresses ONLY covered members, respects blocking/isolation/OOB, and is suppressed
    during global blocking (window/switch/presence).
    """

    CONTEXT_ID = "member_template"

    def __init__(self, group: ClimateGroupHelper):
        """Initialize the template call handler."""
        super().__init__(group)
        self._debounce_delay = RANGE_TEMPLATE_DEBOUNCE_DELAY

    def _is_member_blocked(self, entity_id: str) -> bool:
        """Extend base blocking with OOB check (same as SyncCallHandler)."""
        return super()._is_member_blocked(entity_id) or self._is_oob_blocked(entity_id)

    def _get_target_value(self, attr: str, value: Any = None) -> Any:
        """Read from target_state with group_offset applied for temperature attributes."""
        if self._apply_group_offset():
            return self._get_target_value_with_offset(attr, value)
        return getattr(self.target_state, attr, None)

    def _block_unsynced_entity(self, attr: str, target_value: Any, state: State) -> bool:  # noqa: ARG002
        """Address ONLY template-covered members — skip everything else."""
        return not self._group.member_template_manager.is_covered_state(state)

    def _block_all_calls(self, data: dict[str, Any] | SyncTarget = SYNC_TARGET) -> bool:  # noqa: ARG002
        """Suppress changeover while a temporary state is active."""
        return self._group.run_state.temporary_state_active

    def _apply_group_offset(self) -> bool:
        # Suspended during temporary state (blocking sources or boost).
        return not self._group.run_state.temporary_state_active

