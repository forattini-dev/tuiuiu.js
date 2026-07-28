/**
 * Experimental APIs
 *
 * These exports are intentionally outside the stable barrels. Their contracts
 * may change between minor versions until the documented behavior is complete.
 */

export {
  createEditableDataTable,
  createVirtualDataTable,
  VirtualDataTable,
  EditableDataTable,
  type VirtualDataTableOptions,
  type VirtualDataTableRange,
  type VirtualDataTableState,
  type EditableColumn,
  type EditableDataTableOptions,
  type EditableDataTableCell,
  type EditableDataTableState,
} from '../organisms/data-table.js';
