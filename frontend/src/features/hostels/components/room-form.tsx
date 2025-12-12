'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import HostelImageUpload from './hostel-image-upload';
import RoomForm from './room-form';
import { useMutation } from '@tanstack/react-query';
import { createHostel } from '@/features/hostels';
import type { Hostel } from '@/types/entities.types';

const schema = z.object({
  name: z.string().min(3),
  address: z.string().min(5),
  description: z.string().min(10),
  pricePerMonth: z.number().positive(),
  amenities: z.array(z.string()),
  // Add more fields as needed
});

type FormData = z.infer<typeof schema>;

export default function HostelForm({ initialData }: { initialData?: Hostel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || { amenities: [] },
  });

  const mutation = useMutation({
    mutationFn: createHostel,
    onSuccess: () => toast.success('Hostel created!'),
    onError: () => toast.error('Failed to create hostel'),
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div>
        <Label htmlFor="name">Hostel Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register('address')} />
        {errors.address && (
          <p className="text-red-500 text-sm">{errors.address.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="pricePerMonth">Price per Month (KSh)</Label>
        <Input
          id="pricePerMonth"
          type="number"
          {...register('pricePerMonth', { valueAsNumber: true })}
        />
        {errors.pricePerMonth && (
          <p className="text-red-500 text-sm">{errors.pricePerMonth.message}</p>
        )}
      </div>
      <div>
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {['WiFi', 'Security', 'Kitchen', 'Laundry', 'Gym'].map((amenity) => (
            <div key={amenity} className="flex items-center">
              <Checkbox
                id={amenity}
                onCheckedChange={(checked) => {
                  const current = formState.amenities || [];
                  setValue(
                    'amenities',
                    checked
                      ? [...current, amenity]
                      : current.filter((a) => a !== amenity),
                  );
                }}
              />
              <label htmlFor={amenity} className="ml-2">
                {amenity}
              </label>
            </div>
          ))}
        </div>
      </div>
      <HostelImageUpload
        onImagesChange={(images) => setValue('images', images)}
      />
      <RoomForm /> {/* Assuming this adds rooms */}
      <Button type="submit" disabled={mutation.isPending}>
        Save Hostel
      </Button>
    </form>
  );
}
