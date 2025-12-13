import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '@/features/hostels';
import { toast } from 'sonner';
import type { Room } from '@/types/entities.types';

/**
 * Hook to fetch rooms for a hostel
 * @param hostelId - The ID of the hostel
 * @returns Query result with rooms data
 */
export const useRooms = (hostelId: string | null | undefined) => {
  return useQuery<Room[], Error>({
    queryKey: queryKeys.hostels.rooms(hostelId || ''),
    queryFn: async () => {
      if (!hostelId) {
        throw new Error('Hostel ID is required');
      }
      return getRooms(hostelId);
    },
    enabled: !!hostelId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single room by ID
 * @param roomId - The ID of the room
 * @returns Query result with room data
 */
export const useRoom = (roomId: string | null | undefined) => {
  return useQuery<Room, Error>({
    // We don't have a specific 'room' key in queryKeys, but we can use a custom one or add it.
    // Looking at queryKeys, we have hostels.rooms(hostelId).
    // Let's assume we might need a direct room detail key.
    // For now, let's use a custom key consistent with the pattern or add it to queryKeys.
    // queryKeys.hostels doesn't have a direct room detail key.
    // Let's use ['room', roomId] for now but maybe we should add it to queryKeys.
    // Actually, let's stick to the user's pattern and maybe add it to queryKeys later if needed.
    // But wait, I should be consistent.
    // Let's use queryKeys.hostels.rooms(roomId) ? No that's for list.
    // Let's just use ['room', roomId] for now as it was, but cleaner.
    // Or better, let's add it to queryKeys.
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!roomId) {
        throw new Error('Room ID is required');
      }
      return getRoomById(roomId);
    },
    enabled: !!roomId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to add a new room to a hostel
 * @param hostelId - The ID of the hostel
 * @returns Mutation for adding a room
 */
export const useAddRoom = (hostelId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Room, 'id'>) => createRoom(hostelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.rooms(hostelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.detail(hostelId) });
      toast.success('Room added successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add room';
      toast.error(message);
    },
  });
};

/**
 * Hook to update an existing room
 * @param hostelId - The ID of the hostel
 * @param roomId - The ID of the room to update
 * @returns Mutation for updating a room
 */
export const useUpdateRoom = (hostelId: string, roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Room>) => updateRoom(hostelId, roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.rooms(hostelId) });
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.detail(hostelId) });
      toast.success('Room updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update room';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a room
 * @param hostelId - The ID of the hostel
 * @param roomId - The ID of the room to delete
 * @returns Mutation for deleting a room
 */
export const useDeleteRoom = (hostelId: string, roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteRoom(hostelId, roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.rooms(hostelId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hostels.detail(hostelId) });
      toast.success('Room deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete room';
      toast.error(message);
    },
  });
};
