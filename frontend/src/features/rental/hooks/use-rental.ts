'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { rentalApi } from '../api/client';
import { useSelectedOrgStore } from '@/stores/selected-org.store';
import { isGateRejection } from '@/lib/api/gate';
import type { Property, RentalUnit, Tenancy } from '../types';

const keys = {
  organizations: ['rental', 'organizations'] as const,
  properties: (orgId?: string | null) => ['rental', 'properties', orgId ?? 'own'] as const,
  property: (id: string) => ['rental', 'properties', id] as const,
  units: (propertyId?: string, orgId?: string | null) => ['rental', 'units', propertyId ?? 'all', orgId ?? 'own'] as const,
  tenants: (orgId?: string | null) => ['rental', 'tenants', orgId ?? 'own'] as const,
  tenancies: (orgId?: string | null) => ['rental', 'tenancies', orgId ?? 'own'] as const,
  rentCharges: (status?: string, orgId?: string | null) => ['rental', 'rent-charges', status ?? 'all', orgId ?? 'own'] as const,
  rentBalance: (tenancyId?: string, orgId?: string | null) => ['rental', 'rent-balance', tenancyId ?? 'all', orgId ?? 'own'] as const,
  payments: (orgId?: string | null) => ['rental', 'payments', orgId ?? 'own'] as const,
  incomeSummary: (orgId?: string | null) => ['rental', 'income-summary', orgId ?? 'own'] as const,
};

// WR-01 (03-REVIEW.md): the rejected value from axiosInstance is the
// normalized ApiError shape ({ message, statusCode, details }), not a raw
// AxiosError — it has no `.response` property. Read the message the
// interceptor already computed instead.
function errorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { message?: string };
  return anyErr?.message || fallback;
}

/** Only meaningful for super_admin — every other role is already server-scoped. */
function useSelectedOrgId() {
  return useSelectedOrgStore((s) => s.selectedOrgId);
}

// -- Organizations (super_admin only) --

export const useOrganizations = () =>
  useQuery({ queryKey: keys.organizations, queryFn: rentalApi.listOrganizations });

export const useCreateOrganization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; organization_type?: string }) =>
      rentalApi.createOrganization(payload),
    onSuccess: () => {
      // Invalidates 'onboarding-status' (owned by use-auth.ts's
      // useOnboardingStatus, Plan 04-03), not keys.organizations — that key
      // is the super_admin-only cross-org list this landlord never sees.
      qc.invalidateQueries({ queryKey: ['onboarding-status'] });
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not create organization')),
  });
};

// -- Caretakers --

export const useCaretakers = () =>
  useQuery({ queryKey: ['rental', 'caretakers'], queryFn: rentalApi.listCaretakers });

export const useCreateCaretaker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rentalApi.createCaretaker,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'caretakers'] });
      toast.success('Caretaker added — they\'ll get an email to set up their password');
    },
    onError: (err) => {
      if (isGateRejection(err)) return;
      toast.error(errorMessage(err, 'Could not add caretaker'));
    },
  });
};

// -- Properties --

export const useProperties = () => {
  const orgId = useSelectedOrgId();
  return useQuery({
    queryKey: keys.properties(orgId),
    queryFn: () => rentalApi.listProperties(orgId ?? undefined),
  });
};

export const useProperty = (id: string) =>
  useQuery({ queryKey: keys.property(id), queryFn: () => rentalApi.getProperty(id), enabled: !!id });

export const useCreateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Property>) => rentalApi.createProperty(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'properties'] });
      toast.success('Property added');
    },
    onError: (err) => {
      if (isGateRejection(err)) return;
      toast.error(errorMessage(err, 'Could not add property'));
    },
  });
};

export const useUpdateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Property> }) =>
      rentalApi.updateProperty(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rental', 'properties'] });
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
      qc.invalidateQueries({ queryKey: ['rental', 'properties'] });
      toast.success('Property archived');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not archive property')),
  });
};

// -- Units --

export const useUnits = (propertyId?: string) => {
  const orgId = useSelectedOrgId();
  return useQuery({
    queryKey: keys.units(propertyId, orgId),
    queryFn: () => rentalApi.listUnits(propertyId, orgId ?? undefined),
  });
};

export const useCreateUnit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => rentalApi.createUnit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'units'] });
      toast.success('Unit added');
    },
    onError: (err) => {
      if (isGateRejection(err)) return;
      toast.error(errorMessage(err, 'Could not add unit'));
    },
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

export const useTenants = () => {
  const orgId = useSelectedOrgId();
  return useQuery({
    queryKey: keys.tenants(orgId),
    queryFn: () => rentalApi.listTenants(orgId ?? undefined),
  });
};

export const useCreateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => rentalApi.createTenant(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'tenants'] });
      toast.success('Tenant added');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not add tenant')),
  });
};

// -- Tenancies --

export const useTenancies = () => {
  const orgId = useSelectedOrgId();
  return useQuery({
    queryKey: keys.tenancies(orgId),
    queryFn: () => rentalApi.listTenancies(orgId ?? undefined),
  });
};

export const useCreateTenancy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => rentalApi.createTenancy(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'tenancies'] });
      qc.invalidateQueries({ queryKey: ['rental', 'units'] });
      toast.success('Tenancy created');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not create tenancy — is the unit already occupied?')),
  });
};

export const useUpdateTenancy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      rentalApi.updateTenancy(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'tenancies'] });
      toast.success('Tenancy updated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not update tenancy')),
  });
};

export const useTerminateTenancy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, moveOutDate }: { id: string; moveOutDate?: string }) =>
      rentalApi.terminateTenancy(id, moveOutDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'tenancies'] });
      qc.invalidateQueries({ queryKey: ['rental', 'units'] });
      toast.success('Tenancy terminated');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not terminate tenancy')),
  });
};

// -- Rent --

export const useRentCharges = (status?: string) => {
  const orgId = useSelectedOrgId();
  return useQuery({
    queryKey: keys.rentCharges(status, orgId),
    queryFn: () => rentalApi.listRentCharges({ status, organizationId: orgId ?? undefined }),
  });
};

export const useRentBalance = (tenancyId?: string) => {
  const orgId = useSelectedOrgId();
  return useQuery({
    queryKey: keys.rentBalance(tenancyId, orgId),
    queryFn: () => rentalApi.getRentBalance(tenancyId, orgId ?? undefined),
  });
};

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

export const usePayments = () => {
  const orgId = useSelectedOrgId();
  return useQuery({
    queryKey: keys.payments(orgId),
    queryFn: () => rentalApi.listPayments(orgId ?? undefined),
  });
};

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: ({ tenancyId, amount }: { tenancyId: string; amount: string }) =>
      rentalApi.initiatePayment(tenancyId, amount),
    onError: (err) => toast.error(errorMessage(err, 'Could not start payment')),
  });
};

export const useIncomeSummary = () => {
  const orgId = useSelectedOrgId();
  const query = useQuery({
    queryKey: keys.incomeSummary(orgId),
    queryFn: () => rentalApi.getIncomeSummary({ organizationId: orgId ?? undefined }),
    // WR-04: a blocked (e.g. starter-tier) landlord's analytics gate
    // rejection is a deterministic 4xx — retrying it twice with backoff
    // just delays the gate banner and sends redundant requests that can
    // never succeed. Only retry 5xx/network/429 failures.
    retry: (failureCount, err) => {
      const status = (err as { statusCode?: number } | undefined)?.statusCode;
      return status !== undefined && status < 500 && status !== 429 ? false : failureCount < 2;
    },
  });

  // TanStack Query v5 removed onError/onSuccess from useQuery — this useEffect
  // reproduces the same "toast for non-gate errors only" behavior the other
  // gate-aware hooks get via useMutation's onError.
  useEffect(() => {
    if (query.error && !isGateRejection(query.error)) {
      toast.error(errorMessage(query.error, 'Could not load income summary'));
    }
  }, [query.error]);

  return query;
};

export const useRecordManualPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rentalApi.recordManualPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rental', 'payments'] });
      qc.invalidateQueries({ queryKey: ['rental', 'rent-charges'] });
      qc.invalidateQueries({ queryKey: ['rental', 'rent-balance'] });
      qc.invalidateQueries({ queryKey: ['ledger'] }); // invoices, receipts, deposits
      toast.success('Payment recorded — receipt sent to the tenant');
    },
    onError: (err) => toast.error(errorMessage(err, 'Could not record payment')),
  });
};
