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
  room_number: z.string().min(1),
  base_price: z.number().positive(),
  capacity: z.number().int().positive(),
  room_type: z.enum(['single_rooms', 'shared_rooms', 'mixed']),
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
    defaultValues: {
      room_type: 'single_rooms',
      room_number: '',
      capacity: 1
    }
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => createRoom(hostelId, {
      ...data,
      base_price: String(data.base_price)
    }),
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
        <Label htmlFor="room_number">Room Number</Label>
        <Input id="room_number" {...register('room_number')} />
        {errors.room_number && (
          <p className="text-red-500 text-sm">{errors.room_number.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="base_price">Price (KSh)</Label>
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

      <div>
        <Label htmlFor="room_type">Room Type</Label>
        <select
          id="room_type"
          {...register('room_type')}
          className="w-full p-2 border rounded-md"
        >
          <option value="single_rooms">Single Room</option>
          <option value="shared_rooms">Shared Room</option>
          <option value="mixed">Mixed</option>
        </select>
        {errors.room_type && (
          <p className="text-red-500 text-sm">{errors.room_type.message}</p>
        )}
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        Add Room
      </Button>
    </form>
  );
}
