import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getInventoryTemplate,
  createInventoryTemplate,
  startCheckIn,
  submitCheckIn,
  verifyCheckIn,
  InventoryItem,
} from '@/features/inventory';
import { 
  getInventoryItems, 
  InventoryItem as FullInventoryItem 
} from '@/features/inventory';
import { toast } from 'sonner';

export const useInventoryTemplate = (hostelId: string) => {
  return useQuery({
    queryKey: queryKeys.inventory.template(hostelId),
    queryFn: () => getInventoryTemplate(hostelId),
    enabled: !!hostelId,
  });
};

export const useCreateInventoryTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hostelId, items }: { hostelId: string; items: Omit<InventoryItem, 'id'>[] }) =>
      createInventoryTemplate(hostelId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.template(variables.hostelId) });
      toast.success('Inventory template created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create inventory template');
    },
  });
};

export const useStartCheckIn = () => {
  return useMutation({
    mutationFn: startCheckIn,
    onSuccess: () => {
      toast.success('Check-in started successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to start check-in');
    },
  });
};

export const useSubmitCheckIn = () => {
  return useMutation({
    mutationFn: ({ checkInId, items }: { checkInId: string; items: InventoryItem[] }) =>
      submitCheckIn(checkInId, items),
    onSuccess: () => {
      toast.success('Check-in submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit check-in');
    },
  });
};

export const useVerifyCheckIn = () => {
  return useMutation({
    mutationFn: ({ checkInId, verified, notes }: { checkInId: string; verified: boolean; notes?: string }) =>
      verifyCheckIn(checkInId, verified, notes),
    onSuccess: () => {
      toast.success('Check-in verified successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify check-in');
    },
  });
};

// Full inventory hook for the caretaker/landlord inventory management page
export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory', 'all'],
    queryFn: () => getInventoryItems(),
  });
};

