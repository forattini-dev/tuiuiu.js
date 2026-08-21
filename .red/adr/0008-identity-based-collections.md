# ADR 0008: Collection navigation uses stable identity

- Status: accepted
- Date: 2026-08-21

## Context

Select, MultiSelect, Menu, Tabs, CommandPalette, completion, and lists each
implemented cursor, filtering, disabled-item skipping, and viewport logic.
Index-based state was lost or shifted when data changed.

## Decision

`CollectionController` is the canonical non-visual collection navigation
module. Cursor and selection are stored by stable key. Reconciliation,
modality, filtering, grouping, and ensure-visible behavior live behind its
interface.

Collection components remain data-driven presentation adapters. Arbitrary
object values must provide stable keys.

Tabs, Select, MultiSelect, Menu, Autocomplete, TextInput completion, and
CommandPalette use the controller as their shared non-visual state model.

## Consequences

Reordering preserves logical state, removal has deterministic fallback, and a
shared contract suite covers every collection adapter. Rendering concerns and
VNode handlers stay in their owning component layers.
