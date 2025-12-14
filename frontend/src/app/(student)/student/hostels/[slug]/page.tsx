'use client';

import * as React from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Star,
  Heart,
  Share2,
  Wifi,
  Shield,
  ArrowLeft,
  Check,
  X,
  Phone,
  Mail,
  Home,
  Users,
  Building,
  UserPlus,
  MessageCircle,
  Flag,
  Grid,
} from 'lucide-react';
import { useHostelBySlug, hostelsApi } from '@/features/hostels';
import { cn } from '@/lib/utils';
import { HostelBookingWidget } from '@/features/hostels';
import type { Room } from '@/types/entities.types';

function ImageGallery({ images }: { images: string[] }) {
  const displayImages = images.slice(0, 5);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[500px]">
        {/* Main Image */}
        <div className="col-span-1 md:col-span-2 md:row-span-2 relative h-full cursor-pointer group">
          <Image
            src={displayImages[0] || '/images/cards/card-01.jpg'}
            alt="Main hostel image"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        
        {/* Thumbnail Grid */}
        <div className="hidden md:grid col-span-2 grid-cols-2 gap-2 h-full">
          {displayImages.slice(1).map((img, idx) => (
            <div
              key={idx}
              className="relative h-full cursor-pointer group overflow-hidden"
            >
              <Image
                src={img}
                alt={`Hostel image ${idx + 2}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      </div>
      
      <Button 
        variant="secondary" 
        size="sm" 
        className="absolute bottom-4 right-4 gap-2 shadow-lg bg-white/90 hover:bg-white text-slate-900"
      >
        <Grid className="h-4 w-4" />
        Show all photos
      </Button>
    </div>
  );
}

export default function HostelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const { data: rawHostel, isLoading: isLoadingHostel, error } = useHostelBySlug(slug);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(false);

  // Fetch rooms for this hostel if not included in hostel response
  const {
    data: roomsResponse,
    isLoading: isLoadingRooms,
  } = useQuery({
    queryKey: ['hostel-rooms', rawHostel?.id],
    queryFn: () => hostelsApi.getRooms({ hostel: rawHostel?.id }),
    enabled: Boolean(rawHostel?.id) && (!rawHostel?.rooms || rawHostel.rooms.length === 0),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingHostel || isLoadingRooms;

  // Combine hostel with rooms data
  const hostel = React.useMemo(() => {
    if (!rawHostel) return null;
    
    // Use rooms from hostel response if available, otherwise use separately fetched rooms
    const rooms: Room[] = (rawHostel.rooms && rawHostel.rooms.length > 0)
      ? rawHostel.rooms
      : (roomsResponse?.results || []);
    
    return {
      ...rawHostel,
      rooms,
      // Also set pricePerMonth from base_price if not set
      pricePerMonth: rawHostel.pricePerMonth || parseFloat(rawHostel.base_price) || 8000,
    };
  }, [rawHostel, roomsResponse]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-64 md:h-96 w-full rounded-2xl" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Hostel not found</h2>
        <Button onClick={() => router.push('/student/hostels')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Hostels
        </Button>
      </div>
    );
  }

  const price = parseFloat(hostel.base_price);
  const rating = parseFloat(hostel.rating);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Image Gallery */}
      <ImageGallery images={hostel.images} />

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{hostel.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{hostel.city}, {hostel.university}</span>
                  </div>
                  {hostel.distance_from_university && (
                    <>
                      <span>•</span>
                      <span className="text-sm">{parseFloat(hostel.distance_from_university).toFixed(1)}km from campus</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="rounded-full"
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-current text-red-500")} />
                </Button>
                <Button size="icon" variant="outline" className="rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap mt-3">
              <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-full">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-sm">({hostel.review_count} reviews)</span>
              </div>
              
              {hostel.is_verified && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              
              <Badge variant="secondary">
                {hostel.hostel_type.replace('_', ' ').toUpperCase()}
              </Badge>
              
              {hostel.gender_policy !== 'mixed' && (
                <Badge variant="outline">
                  {hostel.gender_policy === 'male_only' ? 'Male Only' : 'Female Only'}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold mb-3">About this hostel</h2>
            <p className="text-muted-foreground leading-relaxed">
              {hostel.description}
            </p>
          </div>

          <Separator />

          {/* Amenities */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {hostel.amenities_list.map((amenity) => (
                <div key={amenity} className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                    {amenity.toLowerCase().includes('wifi') && <Wifi className="h-4 w-4 text-emerald-600" />}
                    {amenity.toLowerCase().includes('security') && <Shield className="h-4 w-4 text-emerald-600" />}
                    {!amenity.toLowerCase().includes('wifi') && !amenity.toLowerCase().includes('security') && (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* House Rules */}
          {hostel.rules && (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-4">House Rules</h2>
                <p className="text-muted-foreground whitespace-pre-line">
                  {hostel.rules}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Landlord Info */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Managed by</h2>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                      <Building className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{hostel.landlord_name}</h3>
                      <p className="text-sm text-muted-foreground">Joined December 2023</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center gap-2">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">124</span> Reviews
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Verified</span> Identity
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Superhost</span>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        className={cn(
                          "flex-1 md:flex-none",
                          !isFollowing && "bg-emerald-600 hover:bg-emerald-700"
                        )}
                        onClick={() => setIsFollowing(!isFollowing)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                      <Button variant="outline" className="flex-1 md:flex-none">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Host
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-emerald-600" />
                      <span>365 Reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span>Identity verified</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-emerald-600" />
                      <span>Response rate: 100%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span>Response time: within an hour</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{hostel.landlord_phone}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                    <Flag className="h-4 w-4 mr-2" />
                    Report this listing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Booking Widget */}
        <HostelBookingWidget hostel={hostel} basePath="/student/hostels" />
      </div>
    </div>
  );
}
