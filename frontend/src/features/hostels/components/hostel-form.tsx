'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
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
  base_price: z.number().positive(),
  amenities: z.array(z.string()),
  images: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

export default function HostelForm({ initialData }: { initialData?: Hostel }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
        name: initialData?.name || '',
        address: initialData?.address || '',
        description: initialData?.description || '',
        base_price: Number(initialData?.base_price) || 0,
        amenities: initialData?.amenities_list || [],
        images: initialData?.images || [],
    },
  });

  const mutation = useMutation({
    mutationFn: createHostel,
    onSuccess: () => toast.success('Hostel created!'),
    onError: () => toast.error('Failed to create hostel'),
  });

  const onSubmit: SubmitHandler<FormData> = (data) => mutation.mutate(data);

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
        <Label htmlFor="base_price">Price per Month (KSh)</Label>
        <Input
          id="base_price"
          type="number"
          {...register('base_price', { valueAsNumber: true })}
        />
        {errors.base_price && (
          <p className="text-red-500 text-sm">{errors.base_price.message}</p>
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
                  const currentValues = getValues('amenities');
                  const current = Array.isArray(currentValues) ? currentValues : [];
                  setValue(
                    'amenities',
                    checked
                      ? [...current, amenity]
                      : current.filter((a: string) => a !== amenity),
                  );
                }}
                defaultChecked={initialData?.amenities_list?.includes(amenity)}
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
        initialImages={getValues('images')}
      />
      {initialData?.id && <RoomForm hostelId={String(initialData.id)} />}
      <Button type="submit" disabled={mutation.isPending}>
        Save Hostel
      </Button>
    </form>
  );
}
