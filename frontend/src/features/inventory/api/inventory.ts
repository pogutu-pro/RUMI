import api from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';

// ==========================================
// Types
// ==========================================

export type ItemCondition = 'working' | 'not_working' | 'missing' | 'damaged' | 'good' | 'worn';

export type InventoryCategory = 
  | 'kitchen' 
  | 'bathroom' 
  | 'bedroom' 
  | 'living_area' 
  | 'shared';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string; // e.g., 'pcs', 'sets'
  description?: string;
  // The 'condition' on the item itself represents its last verified state
  condition: ItemCondition;
  location: string;
  costPerfUnit?: number; // Replacement cost
  lastCheckedAt?: string; // ISO date string of last verification
}

export type ReportType = 'check_in' | 'check_out';

export type ReportStatus = 
  | 'draft'               // Student filling it out
  | 'submitted'           // Student sent, waiting for caretaker
  | 'verified'            // Caretaker checked, waiting for landlord
  | 'disputed'            // Landlord rejected, back to caretaker
  | 'approved'            // Landlord accepted (Final state for Check-In)
  | 'completed'           // Final state (Check-Out invoice generated)
  | 'auto_accepted';      // System auto-accepted after timeout

export interface InventoryReportItem {
  itemId: string;
  itemSnapshot: InventoryItem; // Snapshot of item at time of report creation
  
  // Student Input
  studentCondition: ItemCondition;
  studentComment?: string;
  
  // Caretaker Input
  caretakerCondition?: ItemCondition;
  caretakerComment?: string;
  isFlagged: boolean; // True if there's a mismatch or damage
  
  // Landlord/Damage Logic
  damageCost?: number;
  isChargeable?: boolean;
}

export interface InventoryReport {
  id: string;
  bookingId: string;
  roomNumber: string;
  studentId: string;
  type: ReportType;
  status: ReportStatus;
  
  items: InventoryReportItem[];
  
  createdAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  
  caretakerNote?: string;
  landlordNote?: string;
}

// ==========================================
// API Payloads
// ==========================================

export interface CreateReportPayload {
  bookingId: string;
  type: ReportType;
}

export interface SubmitReportPayload {
  reportId: string;
  items: {
    itemId: string;
    condition: ItemCondition;
    comment?: string;
  }[];
}

export interface VerifyReportPayload {
  reportId: string;
  items: {
    itemId: string;
    condition: ItemCondition;
    comment?: string;
    isChargeable?: boolean;
    damageCost?: number;
  }[];
  generalNote?: string;
}

export interface ApproveReportPayload {
  reportId: string;
  action: 'approve' | 'dispute';
  disputeReason?: string;
}

// ==========================================
// API Methods
// ==========================================

// ==========================================
// API Methods
// ==========================================

export const getInventoryItems = async (
  params?: { hostelId?: string; roomId?: string }
): Promise<InventoryItem[]> => {
  // Use template endpoint if hostelId is present, or assume backend handles generic items
  // SETUP_GUIDE: /api/v1/hostels/{hostel_id}/inventory/template/
  const path = params?.hostelId 
    ? `/hostels/${params.hostelId}/inventory/template/`
    : '/hostels/inventory/items/'; // Fallback or if needed
    
  const response = await api.axios.get<ApiResponse<InventoryItem[]>>(
    path,
    { params },
  );
  return response.data.data ?? [];
};

export const getMyReport = async (
  bookingId: string, 
  type: ReportType
): Promise<InventoryReport | null> => {
  // Try to find report by booking ID via list or specific endpoint if exists
  // SETUP_GUIDE doesn't explicitly list 'my-report', but we can try filtering
  const response = await api.axios.get<ApiResponse<InventoryReport>>(
    `/hostels/checkin/my-report/`,
    { params: { bookingId, type } }
  );
  return response.data.data ?? null;
};

export const getReportById = async (reportId: string): Promise<InventoryReport> => {
  const response = await api.axios.get<ApiResponse<InventoryReport>>(
    `/hostels/checkin/${reportId}/`
  );
  if (!response.data.data) throw new Error('Report not found');
  return response.data.data;
};

export const createReport = async (payload: CreateReportPayload): Promise<InventoryReport> => {
  // SETUP_GUIDE: /api/v1/hostels/checkin/{booking_id}/start/
  const response = await api.axios.post<ApiResponse<InventoryReport>>(
    `/hostels/checkin/${payload.bookingId}/start/`,
    { type: payload.type }
  );
  if (!response.data.data) throw new Error('Failed to create report');
  return response.data.data;
};

export const submitReport = async (payload: SubmitReportPayload): Promise<InventoryReport> => {
  // SETUP_GUIDE: /api/v1/hostels/checkin/{checkin_id}/submit/
  const response = await api.axios.put<ApiResponse<InventoryReport>>(
    `/hostels/checkin/${payload.reportId}/submit/`,
    { items: payload.items }
  );
  if (!response.data.data) throw new Error('Failed to submit report');
  return response.data.data;
};

export const verifyReport = async (payload: VerifyReportPayload): Promise<InventoryReport> => {
  // SETUP_GUIDE: /api/v1/hostels/checkin/{checkin_id}/verify/
  const response = await api.axios.put<ApiResponse<InventoryReport>>(
    `/hostels/checkin/${payload.reportId}/verify/`,
    payload
  );
  if (!response.data.data) throw new Error('Failed to verify report');
  return response.data.data;
};

export const approveReport = async (payload: ApproveReportPayload): Promise<InventoryReport> => {
  // SETUP_GUIDE doesn't explicitly list approve, but likely follows similar pattern or part of verify flow for landlord
  // We'll map to a likely endpoint or keep as is if not confirmed.
  // Using consistent path structure:
  const response = await api.axios.post<ApiResponse<InventoryReport>>(
    `/hostels/checkin/${payload.reportId}/approve/`,
    payload
  );
  if (!response.data.data) throw new Error('Failed to approve report');
  return response.data.data;
};

// Caretaker/Landlord Lists
export const getPendingReports = async (
  role: 'caretaker' | 'landlord'
): Promise<InventoryReport[]> => {
  const response = await api.axios.get<ApiResponse<InventoryReport[]>>(
    `/inventory/reports/pending`,
    { params: { role } }
  );
  return response.data.data ?? [];
};

export const inventoryApi = {
  getInventoryItems,
  getMyReport,
  getReportById,
  createReport,
  submitReport,
  verifyReport,
  approveReport,
  getPendingReports
} as const;
