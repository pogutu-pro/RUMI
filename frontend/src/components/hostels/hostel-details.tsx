
'use client';
import { useQuery } from '@tanstack/react-query';
import { getHostelReviews } from '@/lib/api/reviews';
import HostelHero from './hostel-hero';
import HostelGallery from './hostel-gallery';
import HostelInfo from './hostel-info';
import HostelAmenities from './hostel-amenities';
import HostelLandlordCard from './hostel-landlord-card';
import HostelLocationMap from './hostel-location-map';
import HostelReviewsSection from './hostel-reviews-section';
import type { Hostel } from '@/types/entities.types';

interface HostelDetailsProps {
  hostel: Hostel;
}

/**
 * HostelDetails - Main component for displaying hostel information
 * Premium Airbnb-inspired storytelling flow with rich visuals
 */
export default function HostelDetails({ hostel }: HostelDetailsProps) {
  // Fetch reviews for this hostel
  const { data: reviewsData = [] } = useQuery({
    queryKey: ['hostel-reviews', hostel.id],
    queryFn: () => getHostelReviews(hostel.id.toString()),
  });
  
  return (
    <article className="space-y-12" id="hostel-details">
      {/* About Section - Story and rules */}
      <section className="pb-8 border-b border-gray-200">
        <HostelInfo
          description={hostel.description}
          houseRules={hostel.rules || undefined}
        />
      </section>

      {/* Amenities - What's included */}
      {hostel.amenities_list && hostel.amenities_list.length > 0 && (
        <section className="pb-8 border-b border-gray-200">
          <HostelAmenities amenities={hostel.amenities_list} />
        </section>
      )}

      {/* Landlord Info - Managed By */}
      <section className="pb-8 border-b border-gray-200">
        <HostelLandlordCard hostel={hostel} />
      </section>

      {/* Location - Where you'll be */}
      <section className="pb-8 border-b border-gray-200">
        <HostelLocationMap
          lat={parseFloat(hostel.latitude || '0')}
          lng={parseFloat(hostel.longitude || '0')}
          address={hostel.address}
          distanceToCampus={hostel.distance_from_university ? parseFloat(hostel.distance_from_university) : 0}
        />
      </section>

      {/* Reviews - Social proof */}
      <section id="reviews-section" className="scroll-mt-20">
        <HostelReviewsSection
          reviews={reviewsData}
          averageRating={parseFloat(hostel.rating)}
          reviewCount={hostel.review_count}
        />
      </section>
    </article>
  );
}
