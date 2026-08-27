'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { rentalApi } from '../api/client';
import type { Property, RentalUnit, Tenancy } from '../types';

const keys = {
  properties: ['rental', 'properties'] as const,
  property: (id: string) => ['rental', 'properties', id] as const,
  units: (propertyId?: string) => ['rental', 'units', propertyId ?? 'all'] as const,
  tenants: ['rental', 'tenants'] as const,
  tenancies: ['rental', 'tenancies'] as const,
  rentCharges: (status?: string) => ['rental', 'rent-charges', status ?? 'all'] as const,
  rentBalance: (tenancyId?: string) => ['rental', 'rent-balance', tenancyId ?? 'all'] as const,
  payments: ['rental', 'payments'] as const,
};

function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { detail?: string } } };
  return anyErr?.response?.data?.detail || fallback;
}

// -- Properties --

export const useProperties = () =>
  useQuery({ queryKey: keys.properties, queryFn: rentalApi.listProperties });

export const useProperty = (id: string) =>
  useQuery({ queryKey: keys.property(id), queryFn: () => rentalApi.getProperty(id), enabled: !!id });

export const useCreateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Property>) => rentalApi.createProperty(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.properties });
      toast.success('Property added');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not add property')),
  });
};

export const useUpdateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Property> }) =>
      rentalApi.updateProperty(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: keys.properties });
      qc.invalidateQueries({ queryKey: keys.property(id) });
      toast.success('Property updated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update property')),
  });
};

export const useArchiveProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rentalApi.archiveProperty(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.properties });
      toast.success('Property archived');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not archive property')),
  });
};

// -- Units --

export const useUnits = (propertyId?: string) =>
  useQuery({ queryKey: keys.units(propertyId), queryFn: () => rentalApi.listUnits(propertyId) });

export const useCreateUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => rentalApi.createUnit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'units'] });
      toast.success('Unit added');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not add unit')),
  });
};

export const useUpdateUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RentalUnit> }) =>
      rentalApi.updateUnit(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'units'] });
      toast.success('Unit updated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update unit')),
  });
};

// -- Tenants --

export const useTenants = () => useQuery({ queryKey: keys.tenants, queryFn: rentalApi.listTenants });

export const useCreateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => rentalApi.createTenant(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.tenants });
      toast.success('Tenant added');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not add tenant')),
  });
};

// -- Tenancies --

export const useTenancies = () => useQuery({ queryKey: keys.tenancies, queryFn: rentalApi.listTenancies });

export const useCreateTenancy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => rentalApi.createTenancy(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.tenancies });
      qc.invalidateQueries({ queryKey: ['rental', 'units'] });
      toast.success('Tenancy created');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not create tenancy — is the unit already occupied?')),
  });
};

export const useTerminateTenancy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, moveOutDate }: { id: string; moveOutDate?: string }) =>
      rentalApi.terminateTenancy(id, moveOutDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.tenancies });
      qc.invalidateQueries({ queryKey: ['rental', 'units'] });
      toast.success('Tenancy terminated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not terminate tenancy')),
  });
};

// -- Rent --

export const useRentCharges = (status?: string) =>
  useQuery({ queryKey: keys.rentCharges(status), queryFn: () => rentalApi.listRentCharges(status ? { status } : undefined) });

export const useRentBalance = (tenancyId?: string) =>
  useQuery({ queryKey: keys.rentBalance(tenancyId), queryFn: () => rentalApi.getRentBalance(tenancyId) });

export const useGenerateRentCharges = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => rentalApi.generateRentCharges(),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['rental', 'rent-charges'] });
      qc.invalidateQueries({ queryKey: ['rental', 'rent-balance'] });
      toast.success(`${result.created} rent charge(s) generated`);
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not generate rent charges')),
  });
};

// -- Payments --

export const usePayments = () => useQuery({ queryKey: keys.payments, queryFn: rentalApi.listPayments });

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: ({ tenancyId, amount }: { tenancyId: string; amount: string }) =>
      rentalApi.initiatePayment(tenancyId, amount),
    onError: (err) => toast.error(errorMessage(err, 'Could not start payment')),
  });
};

export const useRecordManualPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rentalApi.recordManualPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.payments });
      qc.invalidateQueries({ queryKey: ['rental', 'rent-charges'] });
      qc.invalidateQueries({ queryKey: ['rental', 'rent-balance'] });
      toast.success('Payment recorded');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not record payment')),
  });
};
