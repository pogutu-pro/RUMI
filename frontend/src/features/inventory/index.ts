// inventory Feature Public API
export * from './components/inventory-check-in-form';
export * from './components/damage-report-form';
export * from './components/inventory-template-form';
export * from './components/inventory-table';
export * from './components/inventory-category-section';
export * from './components/inventory-list';
export * from './components/inventory-check-out-form';
export * from './components/inventory-item-card';
export * from './components/damage-invoice';
export * from './components/inventory-item-row';
export * from './components/damage-report-list';
export * from './components/comparison-view';
export * from './components/damage-report-card';
export * from './stores/use-inventory.store';
export * from './api/damage-reports';
export * from './api/inventory';
export { 
  type InventoryTemplate, 
  type CheckIn, 
  createInventoryTemplate,
  getInventoryTemplate,
  startCheckIn,
  submitCheckIn,
  verifyCheckIn 
} from './api/inventory-api';
export * from './hooks/use-damage-reports';
export * from './hooks/use-inventory'; // Existing hook file (might overlap)
export * from './hooks/use-inventory-query'; // NEW
export * from './types';
