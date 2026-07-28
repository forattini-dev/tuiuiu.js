/**
 * Experimental APIs
 *
 * These exports are intentionally outside the stable barrels. Their contracts
 * may change between minor versions until the documented behavior is complete.
 */

export {
  createVirtualDataTable,
  VirtualDataTable,
  EditableDataTable,
  type VirtualDataTableOptions,
  type VirtualDataTableRange,
  type VirtualDataTableState,
  type EditableColumn,
  type EditableDataTableOptions,
} from '../organisms/data-table.js';
