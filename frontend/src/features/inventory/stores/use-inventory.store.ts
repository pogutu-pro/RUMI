import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  InventoryReport, 
  ItemCondition,
  getReportById,
  verifyReport
} from '@/features/inventory';

interface InventoryState {
  // State (Draft / Local Edit Mode)
  activeReport: InventoryReport | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setReport: (report: InventoryReport | null) => void;
  
  // Async Actions
  fetchReportById: (id: string) => Promise<void>;
  submitVerification: (generalNote?: string) => Promise<void>;

  // Student Local Edits
  updateItemConditionLocal: (itemId: string, condition: ItemCondition, comment?: string) => void;
  
  // Caretaker Local Edits
  verifyItemLocal: (
    itemId: string, 
    condition: ItemCondition, 
    isFlagged: boolean, 
    comment?: string,
    isChargeable?: boolean,
    damageCost?: number
  ) => void;

  reset: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  devtools((set, get) => ({
    activeReport: null,
    isLoading: false,
    error: null,

    // Hydrate store from API data (called by useEffect in component)
    setReport: (report) => set({ activeReport: report }),

    fetchReportById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
            const report = await getReportById(id);
            set({ activeReport: report, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch report', isLoading: false });
        }
    },

    submitVerification: async (generalNote?: string) => {
        const { activeReport } = get();
        if (!activeReport) return;

        set({ isLoading: true, error: null });
        try {
            const itemsPayload = activeReport.items.map(item => ({
                itemId: item.itemId,
                // Default to student condition if not explicitly verified by caretaker, 
                // though ideally caretaker should verify everything.
                condition: item.caretakerCondition || item.studentCondition,
                comment: item.caretakerComment,
                isChargeable: item.isChargeable,
                damageCost: item.damageCost
            }));

            await verifyReport({
                reportId: activeReport.id,
                items: itemsPayload,
                generalNote
            });

            // Refresh report to show updated status
            const updatedReport = await getReportById(activeReport.id);
            set({ activeReport: updatedReport, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to verify report', isLoading: false });
            throw error; // Let component handle redirect if needed
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

    reset: () => set({ activeReport: null, isLoading: false, error: null }),
  }))
);
