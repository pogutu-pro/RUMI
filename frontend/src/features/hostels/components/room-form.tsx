'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { createRoom } from '@/features/hostels';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(3),
  price: z.number().positive(),
  beds: z.number().int().positive(),
  capacity: z.number().int().positive(),
  // Add images, availability, etc.
});

type FormData = z.infer<typeof schema>;

interface RoomFormProps {
  hostelId: string;
}

export default function RoomForm({ hostelId }: RoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => createRoom(hostelId, data),
    onSuccess: () => {
      toast.success('Room added!');
      reset();
    },
    onError: () => toast.error('Failed to add room'),
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="name">Room Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="price">Price (KSh)</Label>
        <Input
          id="price"
          type="number"
          {...register('price', { valueAsNumber: true })}
        />
        {errors.price && (
          <p className="text-red-500 text-sm">{errors.price.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="beds">Number of Beds</Label>
        <Input
          id="beds"
          type="number"
          {...register('beds', { valueAsNumber: true })}
        />
        {errors.beds && (
          <p className="text-red-500 text-sm">{errors.beds.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="capacity">Max Capacity</Label>
        <Input
          id="capacity"
          type="number"
          {...register('capacity', { valueAsNumber: true })}
        />
        {errors.capacity && (
          <p className="text-red-500 text-sm">{errors.capacity.message}</p>
        )}
      </div>

      {/* Add image upload similar to hostel */}

      <Button type="submit" disabled={mutation.isPending}>
        Add Room
      </Button>
    </form>
  );
}
