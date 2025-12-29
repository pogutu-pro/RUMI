import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudents, getLandlords } from '../api/admin';
import { toast } from 'sonner';

export const useAdminStudents = (params?: any) => {
  return useQuery({
    queryKey: ['admin-students', params],
    queryFn: () => getStudents(params),
  });
};

export const useAdminLandlords = (params?: any) => {
  return useQuery({
    queryKey: ['admin-landlords', params],
    queryFn: () => getLandlords(params),
  });
};
