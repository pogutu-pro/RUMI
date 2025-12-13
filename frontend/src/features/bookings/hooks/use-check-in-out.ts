import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  verifyBookingCode,
  processCheckIn,
  uploadCheckInPhotos,
  processCheckOut,
  uploadCheckOutPhotos,
} from '@/features/caretaker';
import type { CheckInData, CheckOutData } from '@/types/caretaker.types';
import { useToast } from '@/hooks/use-toast';

// ==================== Check-In ====================

export function useVerifyBookingCode() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: verifyBookingCode,
    onError: () => {
      toast({
        title: 'Verification Failed',
        description: 'Invalid booking code. Please check and try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useProcessCheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CheckInData) => processCheckIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'rooms'] });
      toast({
        title: 'Check-In Complete',
        description: 'Student has been successfully checked in',
      });
    },
    onError: () => {
      toast({
        title: 'Check-In Failed',
        description: 'Failed to complete check-in process',
        variant: 'destructive',
      });
    },
  });
}

export function useUploadCheckInPhotos() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: uploadCheckInPhotos,
    onError: () => {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload photos',
        variant: 'destructive',
      });
    },
  });
}

// ==================== Check-Out ====================

export function useProcessCheckOut() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CheckOutData) => processCheckOut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['caretaker', 'rooms'] });
      toast({
        title: 'Check-Out Complete',
        description: 'Student has been successfully checked out',
      });
    },
    onError: () => {
      toast({
        title: 'Check-Out Failed',
        description: 'Failed to complete check-out process',
        variant: 'destructive',
      });
    },
  });
}

export function useUploadCheckOutPhotos() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: uploadCheckOutPhotos,
    onError: () => {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload photos',
        variant: 'destructive',
      });
    },
  });
}
