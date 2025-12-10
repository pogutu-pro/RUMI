import api from './client';
import type { ApiResponse } from '@/types/api.types';

export interface DamageReportItem {
  id: string;
  inventoryItemId: string;
  description?: string;
  estimatedCost?: number;
}

export type DamageReportStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'billed';

export interface DamageReport {
  id: string;
  bookingId: string;
  hostelId: string;
  roomId?: string;
  reportedByCaretakerId: string;
  status: DamageReportStatus;
  description: string;
  items: DamageReportItem[];
  totalEstimatedCost?: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface DamageReportListParams {
  hostelId?: string;
  roomId?: string;
  bookingId?: string;
  status?: DamageReportStatus;
}

export interface CreateDamageReportItemInput {
  inventoryItemId: string;
  description?: string;
  estimatedCost?: number;
}

export interface CreateDamageReportPayload {
  bookingId: string;
  items: CreateDamageReportItemInput[];
  notes?: string;
}

export const getDamageReports = async (
  params?: DamageReportListParams,
): Promise<DamageReport[]> => {
  const response = await api.axios.get<ApiResponse<DamageReport[]>>(
    '/damage-reports/',
    { params },
  );
  return response.data.data ?? [];
};

export const getDamageReport = async (id: string): Promise<DamageReport> => {
  const response = await api.axios.get<ApiResponse<DamageReport>>(
    `/damage-reports/${id}/`,
  );
  return response.data.data as DamageReport;
};

export const createDamageReport = async (
  payload: CreateDamageReportPayload,
): Promise<DamageReport> => {
  const response = await api.axios.post<ApiResponse<DamageReport>>(
    '/damage-reports/',
    payload,
  );
  return response.data.data as DamageReport;
};

export const damageReportsApi = {
  getDamageReports,
  getDamageReport,
  createDamageReport,
} as const;

/**
 * ================================================================================
 * README: Damage Reports API Module (damage-reports.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Handles damage report creation and retrieval for check-out inspections.
 * Caretakers create reports; landlords review and approve/reject.
 *
 * BACKEND ENDPOINTS:
 * ------------------
 * | Method | Endpoint              | Function            |
 * |--------|----------------------|---------------------|
 * | GET    | /damage-reports/     | getDamageReports()  |
 * | GET    | /damage-reports/{id}/| getDamageReport()   |
 * | POST   | /damage-reports/     | createDamageReport()|
 *
 * STATUSES:
 * ---------
 * pending → in_review → approved/rejected → billed
 *
 * USAGE:
 * ------
 * ```typescript
 * import { damageReportsApi } from './damage-reports';
 *
 * const reports = await damageReportsApi.getDamageReports({ hostelId: '123' });
 * await damageReportsApi.createDamageReport({
 *   bookingId: '456',
 *   items: [{ inventoryItemId: 'item-1', estimatedCost: 1500 }]
 * });
 * ```
 *
 * ================================================================================
 */
