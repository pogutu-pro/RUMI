import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  InventoryReport, 
  ItemCondition
} from '@/features/inventory';

interface InventoryState {
  // State (Draft / Local Edit Mode)
  activeReport: InventoryReport | null;
  
  // Actions
  setReport: (report: InventoryReport | null) => void;
  
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

    // Hydrate store from API data (called by useEffect in component)
    setReport: (report) => set({ activeReport: report }),

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

    reset: () => set({ activeReport: null }),
  }))
);
