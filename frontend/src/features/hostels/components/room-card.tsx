import Image from 'next/image';
import { Bed, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Room } from '@/types/entities.types';

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-muted">
        {room.images && room.images.length > 0 ? (
          <Image
            src={room.images[0]}
            alt={room.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground bg-slate-100">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{room.name}</h3>
        <div className="flex items-center gap-4 mt-2 text-gray-600">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            {room.beds} beds
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {room.capacity} max
          </div>
        </div>
        <div className="mt-3">
          <span className="text-xl font-bold text-green-600">
            KSh {room.price?.toLocaleString() || '0'}
          </span>
          <span className="text-sm text-gray-600">/month</span>
        </div>
        {room.available && (
          <Badge className="mt-2 bg-green-100 text-green-800">Available</Badge>
        )}
      </div>
    </Card>
  );
}
