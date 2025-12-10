import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bed,
  Users,
  TrendingUp,
  TrendingDown,
  MapPin,
  Building2,
  Sparkles,
  Wind,
} from 'lucide-react';
import { AvailableRoom } from '@/types/entities.types';
import { ROOM_TYPE_LABELS } from '@/lib/constants/transfer-rules';
import { RoommatePreviewCard } from './roommate-preview-card';

interface RoomTransferCardProps {
  room: AvailableRoom;
  onViewDetails?: () => void;
  onRequestTransfer?: () => void;
  className?: string;
}

export function RoomTransferCard({
  room,
  onViewDetails,
  onRequestTransfer,
  className,
}: RoomTransferCardProps) {
  const priceDiff = room.priceDifference;
  const isPriceIncrease = priceDiff > 0;
  const isPriceDecrease = priceDiff < 0;

  return (
    <Card className={cn(
      'group overflow-hidden transition-all duration-300',
      'hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1',
      'border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800',
      className
    )}>
      {/* Room Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-10" />
        
        {room.images && room.images.length > 0 ? (
          <>
            <Image
              src={room.images[0]}
              alt={`Room ${room.roomNumber}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Quiet Floor Badge */}
        {room.isQuietFloor && (
          <Badge className="absolute top-3 left-3 bg-blue-600 text-white border-0">
            <Wind className="h-3 w-3 mr-1" />
            Quiet Floor
          </Badge>
        )}

        {/* Price Difference Badge */}
        {priceDiff !== 0 && (
          <Badge
            className={cn(
              'absolute top-3 right-3 border-0 font-semibold',
              isPriceIncrease &&
                'bg-amber-500 text-white',
              isPriceDecrease &&
                'bg-green-500 text-white'
            )}
          >
            {isPriceIncrease && <TrendingUp className="h-3 w-3 mr-1" />}
            {isPriceDecrease && <TrendingDown className="h-3 w-3 mr-1" />}
            {isPriceIncrease && '+'}
            {isPriceDecrease && '-'}
            KES {Math.abs(priceDiff).toLocaleString()}
          </Badge>
        )}
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Room Header */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Room {room.roomNumber}
              </h3>
              <p className="text-sm text-muted-foreground">
                {room.hostelName}
              </p>
            </div>
            <Badge variant="outline" className="flex-shrink-0">
              <Bed className="h-3 w-3 mr-1" />
              {ROOM_TYPE_LABELS[room.roomType]}
            </Badge>
          </div>

          {/* Price */}
          <div className="mt-2">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              KES {room.currentPrice.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
          </div>
        </div>

        {/* Room Details */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            <span>Floor {room.floor}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>
              {room.currentOccupancy}/{room.capacity} occupied
            </span>
          </div>
          {room.distanceToWashroom && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{room.distanceToWashroom}m to washroom</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {room.amenities.slice(0, 4).map((amenity, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs"
              >
                {amenity}
              </Badge>
            ))}
            {room.amenities.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{room.amenities.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Current Roommate */}
        {room.currentRoommate && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Current Roommate:
            </p>
            <RoommatePreviewCard
              roommate={room.currentRoommate}
              compact
              showCompatibility
            />
          </div>
        )}

        {/* Availability */}
        <div className="text-sm">
          <span className="text-muted-foreground">Available from: </span>
          <span className="font-medium text-foreground">
            {new Date(room.availableFrom).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onViewDetails}
          >
            View Details
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onRequestTransfer}
            disabled={!room.transferEligible}
          >
            {room.transferEligible ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Request Transfer
              </>
            ) : (
              'Not Eligible'
            )}
          </Button>
        </div>

        {/* Ineligibility Reason */}
        {!room.transferEligible && room.ineligibilityReason && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {room.ineligibilityReason}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
