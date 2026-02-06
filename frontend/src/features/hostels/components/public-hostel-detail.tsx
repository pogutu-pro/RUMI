'use client';

import * as React from 'react';
import HostelLayout from './hostel-layout';
import HostelHero from './hostel-hero';
import HostelGallery from './hostel-gallery';
import HostelInfo from './hostel-info';
import HostelAmenities from './hostel-amenities';
import HostelLandlordCard from './hostel-landlord-card';
import HostelLocationMap from './hostel-location-map';
import HostelReviewsSection from './hostel-reviews-section';
import TrustBadges from './trust-badges';
import NearbyHostels from './nearby-hostels';
import { HostelBookingWidget } from './hostel-booking-widget';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, Info, ArrowRight } from 'lucide-react';
import type { Hostel } from '../types';

interface PublicHostelDetailProps {
  hostel: Hostel;
}

export default function PublicHostelDetail({ hostel }: PublicHostelDetailProps) {
  const stickyCta = (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-bold text-gray-900">From KES {hostel.base_price}</p>
        <p className="text-xs text-gray-500">per month</p>
      </div>
      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 shadow-lg shadow-emerald-200">
        Login to Apply
      </Button>
    </div>
  );

  const sidebar = (
    <div className="space-y-6 relative z-10">
      <HostelBookingWidget hostel={hostel} />
      
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-900 leading-relaxed">
            Don't pay anything outside the RUMI platform. We protect your deposit until you move in.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <HostelLayout
      hero={<HostelHero hostel={hostel} />}
      gallery={<HostelGallery images={hostel.images} />}
      sidebar={sidebar}
      stickyCta={stickyCta}
    >
      <section className="space-y-16">
        {/* Core Info */}
        <HostelInfo 
          description={hostel.description} 
          houseRules={hostel.rules || undefined}
          safetyFeatures={hostel.safety_features}
          tenantType={hostel.tenant_type}
          genderPolicy={hostel.gender_policy}
          paymentTerms={`Rent is paid ${hostel.payment_cycle?.replace('_', ' ') || 'monthly'}. \nDeposit: ${hostel.currency} ${hostel.deposit_amount}. \nGrace Period: ${hostel.grace_period_days} days.`}
        />

        {/* Amenities */}
        <HostelAmenities amenities={hostel.amenities_list} />

        {/* Trust Signals */}


        {/* Landlord Card */}
        <HostelLandlordCard hostel={hostel} />

        {/* Location */}
        <HostelLocationMap
          lat={parseFloat(hostel.latitude || '0')}
          lng={parseFloat(hostel.longitude || '0')}
          address={hostel.address}
          distanceToCampus={hostel.distance_from_university ? parseFloat(hostel.distance_from_university) : 0}
        />

        {/* Nearby Hostels */}
        <section className="space-y-8 pt-8">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">More places nearby</h2>
              <p className="text-gray-500">Discover other verified hostels in {hostel.city}</p>
            </div>
          </div>
          <NearbyHostels 
            city={hostel.city} 
            university={hostel.university || undefined} 
            currentHostelId={hostel.id} 
          />
        </section>
      </section>
    </HostelLayout>
  );
}
