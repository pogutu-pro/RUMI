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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Bookmark, MessageSquare, ClipboardCheck, Share2, AlertTriangle } from 'lucide-react';
import type { Hostel } from '../types';
import NearbyHostels from './nearby-hostels';
import { HostelBookingWidget } from './hostel-booking-widget';
import { toast } from 'sonner';

interface DashboardHostelDetailProps {
  hostel: Hostel;
  studentContext: {
    roommateMatchScore: number;
    isSaved: boolean;
    applicationStatus?: string;
  };
}

export default function DashboardHostelDetail({ 
  hostel, 
  studentContext 
}: DashboardHostelDetailProps) {
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: hostel.name,
          text: `Check out this hostel on RUMI: ${hostel.name}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const stickyCta = (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={handleShare} className="shrink-0 h-12 w-12 rounded-xl border-emerald-200">
        <Share2 className="h-5 w-5 text-emerald-600" />
      </Button>
      <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 rounded-xl border-emerald-200">
        <Bookmark className={studentContext.isSaved ? "fill-emerald-600 text-emerald-600" : ""} />
      </Button>
      <Button className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl">
        Apply Now
      </Button>
    </div>
  );

  const sidebar = (
    <div className="space-y-6">
      {/* Personalized Match Card */}
      <Card className="p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-0 shadow-lg shadow-indigo-200 rounded-2xl overflow-hidden relative">
        <Users className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="font-bold text-sm tracking-wide uppercase opacity-90">Roommate match</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-black">{studentContext.roommateMatchScore}%</span>
            <div className="text-xs font-medium leading-tight">
              match with current<br />residents
            </div>
          </div>
          <p className="text-sm opacity-90">Based on your lifestyle preferences and course of study.</p>
        </div>
      </Card>

      {/* Booking Widget */}
      <HostelBookingWidget hostel={hostel} />

      <Button variant="ghost" className="w-full text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs font-medium">
        Report this listing
      </Button>
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
        {/* Personalized Welcome */}
        <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
          <div className="flex gap-4 items-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">Your profile is 85% complete</p>
              <p className="text-sm text-emerald-700">Finish it to speed up your application for this hostel.</p>
            </div>
          </div>
          <Button variant="link" className="text-emerald-700 font-bold">
            Complete Now
          </Button>
        </div>

        {/* Core Info */}
        <HostelInfo 
          description={hostel.description} 
          houseRules={hostel.rules || undefined}
          safetyFeatures={hostel.safety_features}
          tenantType={hostel.tenant_type}
          genderPolicy={hostel.gender_policy}
          paymentTerms={`Rent is paid ${hostel.payment_cycle?.replace('_', ' ') || 'monthly'}. \nDeposit: ${hostel.currency} ${hostel.deposit_amount}. \nGrace Period: ${hostel.grace_period_days} days.`}
        />

        {/* Room Types Grid (Premium specific for students) */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Available Room Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hostel.rooms?.map(room => (
              <Card key={room.id} className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">{room.room_number || 'Single Room'}</h4>
                    <p className="text-xs text-gray-500">{room.capacity} sleeper</p>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-0">Available</Badge>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">Per Month</p>
                    <p className="text-xl font-black text-gray-900">KES {room.base_price}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600">
                    Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Amenities */}
        <HostelAmenities amenities={hostel.amenities_list} />

        {/* Landlord Card (Personalized with contact history?) */}
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
              <h2 className="text-2xl font-bold text-gray-900">Recommended for you</h2>
              <p className="text-sm text-gray-500">Based on your university and preferences</p>
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
