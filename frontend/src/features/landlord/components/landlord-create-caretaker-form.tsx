'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Loader2, UserPlus, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-fields';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  landlordCreateCaretakerSchema,
  type LandlordCreateCaretakerFormData,
} from '@/lib/validations/landlord-caretaker.schema';
import { useCreateCaretaker } from '@/features/landlord';

interface LandlordCreateCaretakerFormProps {
  hostels: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export function LandlordCreateCaretakerForm({
  hostels,
  onSuccess,
}: LandlordCreateCaretakerFormProps) {
  const createMutation = useCreateCaretaker();
  const [showPermissions, setShowPermissions] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LandlordCreateCaretakerFormData>({
    resolver: zodResolver(landlordCreateCaretakerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      hostelId: '',
      permissions: {
        canManageInventory: false,
        canHandleReports: true,
        canViewPayments: false,
        canManageBookings: false,
        canCommunicateWithTenants: true,
      },
      sendInvitationEmail: true,
    },
  });

  const selectedHostelId = watch('hostelId');
  const permissions = watch('permissions');

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createMutation.mutateAsync(data);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  });

  const submitting = isSubmitting || createMutation.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Basic Information
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="First Name"
            placeholder="John"
            error={errors.firstName?.message}
            required
            disabled={submitting}
            {...register('firstName')}
          />
          
          <FormField
            label="Last Name"
            placeholder="Doe"
            error={errors.lastName?.message}
            required
            disabled={submitting}
            {...register('lastName')}
          />
        </div>

        <FormField
          label="Email Address"
          type="email"
          placeholder="caretaker@example.com"
          error={errors.email?.message}
          required
          disabled={submitting}
          {...register('email')}
        />

        <FormField
          label="Phone Number"
          type="tel"
          placeholder="+254712345678"
          error={errors.phone?.message}
          required
          disabled={submitting}
          {...register('phone')}
        />

        <div className="space-y-2">
          <Label htmlFor="hostelId">
            Assign to Hostel <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedHostelId}
            onValueChange={(value) => setValue('hostelId', value)}
            disabled={submitting || hostels.length === 0}
          >
            <SelectTrigger
              id="hostelId"
              className={errors.hostelId ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Select a hostel" />
            </SelectTrigger>
            <SelectContent>
              {hostels.map((hostel) => (
                <SelectItem key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.hostelId && (
            <p className="text-sm text-red-500">{errors.hostelId.message}</p>
          )}
          {hostels.length === 0 && (
            <p className="text-sm text-amber-600">
              You need to create a hostel first before adding caretakers.
            </p>
          )}
        </div>
      </div>

      {/* Permissions */}
      <div className="space-y-4 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPermissions(!showPermissions)}
          >
            {showPermissions ? 'Hide' : 'Show'}
          </Button>
        </div>

        {showPermissions && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canHandleReports"
                checked={permissions?.canHandleReports}
                onCheckedChange={(checked) =>
                  setValue('permissions.canHandleReports', !!checked)
                }
                disabled={submitting}
              />
              <Label htmlFor="canHandleReports" className="text-sm font-normal">
                Can handle maintenance reports
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canCommunicateWithTenants"
                checked={permissions?.canCommunicateWithTenants}
                onCheckedChange={(checked) =>
                  setValue('permissions.canCommunicateWithTenants', !!checked)
                }
                disabled={submitting}
              />
              <Label htmlFor="canCommunicateWithTenants" className="text-sm font-normal">
                Can communicate with tenants
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canManageInventory"
                checked={permissions?.canManageInventory}
                onCheckedChange={(checked) =>
                  setValue('permissions.canManageInventory', !!checked)
                }
                disabled={submitting}
              />
              <Label htmlFor="canManageInventory" className="text-sm font-normal">
                Can manage inventory
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canManageBookings"
                checked={permissions?.canManageBookings}
                onCheckedChange={(checked) =>
                  setValue('permissions.canManageBookings', !!checked)
                }
                disabled={submitting}
              />
              <Label htmlFor="canManageBookings" className="text-sm font-normal">
                Can manage bookings
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="canViewPayments"
                checked={permissions?.canViewPayments}
                onCheckedChange={(checked) =>
                  setValue('permissions.canViewPayments', !!checked)
                }
                disabled={submitting}
              />
              <Label htmlFor="canViewPayments" className="text-sm font-normal">
                Can view payment information
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Send Invitation */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="sendInvitationEmail"
          checked={watch('sendInvitationEmail')}
          onCheckedChange={(checked) =>
            setValue('sendInvitationEmail', !!checked)
          }
          disabled={submitting}
        />
        <Label htmlFor="sendInvitationEmail" className="text-sm font-normal">
          Send invitation email with login credentials
        </Label>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-1"
          disabled={submitting || hostels.length === 0}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Caretaker Account
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
