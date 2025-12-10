import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  InventoryReport, 
  ItemCondition, 
  inventoryApi, 
  ReportType 
} from '@/lib/api/inventory';
import { toast } from 'sonner';

interface InventoryState {
  // State
  activeReport: InventoryReport | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStudentReport: (bookingId: string, type: ReportType) => Promise<void>;
  fetchReportById: (reportId: string) => Promise<void>;
  
  // Student Actions
  updateItemConditionLocal: (itemId: string, condition: ItemCondition, comment?: string) => void;
  submitReport: () => Promise<void>;
  
  // Caretaker Actions
  verifyItemLocal: (
    itemId: string, 
    condition: ItemCondition, 
    isFlagged: boolean, 
    comment?: string,
    isChargeable?: boolean,
    damageCost?: number
  ) => void;
  submitVerification: (generalNote?: string) => Promise<void>;

  reset: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  devtools((set, get) => ({
    activeReport: null,
    isLoading: false,
    error: null,

    fetchStudentReport: async (bookingId, type) => {
      set({ isLoading: true, error: null });
      try {
        let report = await inventoryApi.getMyReport(bookingId, type);
        
        // If no report exists, we might need to create one (or backend does it).
        // For now, assuming backend returns null if not started.
        // In a real flow, we might trigger createReport here if it's the first time.
        if (!report) {
           const newReport = await inventoryApi.createReport({ bookingId, type });
           report = newReport;
        }

        set({ activeReport: report, isLoading: false });
      } catch (err: any) {
        set({ error: err.message || 'Failed to fetch report', isLoading: false });
        toast.error('Failed to load inventory report');
      }
    },

    fetchReportById: async (reportId) => {
      set({ isLoading: true, error: null });
      try {
        const report = await inventoryApi.getReportById(reportId);
        set({ activeReport: report, isLoading: false });
      } catch (err: any) {
        set({ error: err.message || 'Failed to fetch report', isLoading: false });
        toast.error('Failed to load report');
      }
    },

    updateItemConditionLocal: (itemId, condition, comment) => {
      const { activeReport } = get();
      if (!activeReport) return;

      const updatedItems = activeReport.items.map(item => {
        if (item.itemId === itemId) {
          return { ...item, studentCondition: condition, studentComment: comment ?? item.studentComment };
        }
        return item;
      });

      set({ activeReport: { ...activeReport, items: updatedItems } });
    },

    submitReport: async () => {
      const { activeReport } = get();
      if (!activeReport) return;

      set({ isLoading: true });
      try {
        const payload = {
          reportId: activeReport.id,
          items: activeReport.items.map(item => ({
            itemId: item.itemId,
            condition: item.studentCondition,
            comment: item.studentComment,
          })),
        };

        const updatedReport = await inventoryApi.submitReport(payload);
        set({ activeReport: updatedReport, isLoading: false });
        toast.success('Report submitted successfully!');
      } catch (err: any) {
        set({ error: err.message || 'Failed to submit report', isLoading: false });
        toast.error('Failed to submit report. Please try again.');
      }
    },

    verifyItemLocal: (itemId, condition, isFlagged, comment, isChargeable, damageCost) => {
      const { activeReport } = get();
      if (!activeReport) return;

      const updatedItems = activeReport.items.map(item => {
        if (item.itemId === itemId) {
          return { 
            ...item, 
            caretakerCondition: condition, 
            isFlagged, 
            caretakerComment: comment ?? item.caretakerComment,
            isChargeable: isChargeable ?? item.isChargeable,
            damageCost: damageCost ?? item.damageCost
          };
        }
        return item;
      });

      set({ activeReport: { ...activeReport, items: updatedItems } });
    },

    submitVerification: async (generalNote) => {
      const { activeReport } = get();
      if (!activeReport) return;

      set({ isLoading: true });
      try {
        const payload = {
          reportId: activeReport.id,
          generalNote,
          items: activeReport.items.map(item => ({
            itemId: item.itemId,
            condition: item.caretakerCondition || item.studentCondition, // Default to student's if not overriden
            comment: item.caretakerComment,
            isChargeable: item.isChargeable,
            damageCost: item.damageCost
          })),
        };

        const updatedReport = await inventoryApi.verifyReport(payload);
        set({ activeReport: updatedReport, isLoading: false });
        toast.success('Report verified successfully!');
      } catch (err: any) {
        set({ error: err.message || 'Failed to verify report', isLoading: false });
        toast.error('Failed to verify report');
      }
    },

    reset: () => set({ activeReport: null, isLoading: false, error: null }),
  }))
);

/**
 * ================================================================================
 * README: Inventory Store (useInventoryStore.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Manages inventory reports for check-in/check-out workflows with three-tier
 * approval: Student → Caretaker → Landlord. Uses devtools middleware for debugging.
 *
 * STATE:
 * ------
 * | Field        | Type             | Purpose                         |
 * |--------------|------------------|--------------------------------|
 * | activeReport | InventoryReport  | Currently loaded report         |
 * | isLoading    | boolean          | Loading state                   |
 * | error        | string | null    | Error message                   |
 *
 * REPORT WORKFLOW:
 * -----------------
 * 1. Student: Creates report, sets item conditions, submits
 * 2. Caretaker: Verifies items, flags damages, submits verification
 * 3. Landlord: Reviews verified report, approves
 *
 * ACTIONS:
 * --------
 * Fetching:
 * - fetchStudentReport(bookingId, type) - Load or create report
 * - fetchReportById(reportId) - Load specific report
 *
 * Student Actions:
 * - updateItemConditionLocal() - Update item condition in state
 * - submitReport() - Submit report to backend
 *
 * Caretaker Actions:
 * - verifyItemLocal() - Set verification, flag, damage cost
 * - submitVerification() - Submit verification to backend
 *
 * BACKEND INTEGRATION:
 * --------------------
 * Uses: inventoryApi.getMyReport(), createReport(), submitReport(), verifyReport()
 *
 * DEVTOOLS:
 * ---------
 * Uses Zustand devtools middleware for Redux DevTools integration.
 *
 * USAGE:
 * ------
 * ```typescript
 * import { useInventoryStore } from '@/stores/useInventoryStore';
 *
 * const { activeReport, fetchStudentReport, updateItemConditionLocal, submitReport } = useInventoryStore();
 *
 * await fetchStudentReport(bookingId, 'check-in');
 * updateItemConditionLocal(itemId, 'good', 'Looks clean');
 * await submitReport();
 * ```
 *
 * ================================================================================
 */

