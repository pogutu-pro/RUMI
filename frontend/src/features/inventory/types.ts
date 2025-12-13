export interface InventoryStatusSummary {
  totalItems: number;
  goodCondition: number;
  damaged: number;
  missing: number;
  lastUpdated: string;
}
