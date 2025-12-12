'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Shield,
  Star,
  MessageCircle,
} from 'lucide-react';
import type { Hostel } from '@/types/entities.types';

interface HostelLandlordCardProps {
  hostel: Hostel;
}

/**
 * HostelLandlordCard - "Managed By" section showing landlord info
 * Airbnb-style host profile card with contact options
 */
export default function HostelLandlordCard({
  hostel,
}: HostelLandlordCardProps) {
  const landlordName = hostel.landlord_name || 'Property Owner';
  const landlordPhone = hostel.landlord_phone;
  const isVerified = hostel.is_verified;

  // Extract initials for avatar fallback
  const initials = landlordName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="py-12 border-t border-gray-200"
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
        Managed by
      </h2>

      <Card className="p-6 border-2 border-gray-200 hover:border-emerald-200 transition-colors">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Landlord Avatar */}
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center shadow-md">
                <Shield className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Landlord Info */}
          <div className="flex-1 space-y-4">
            {/* Name and status */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {landlordName}
                </h3>
                {isVerified && (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">Property Owner</p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>1 property</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Star className="h-4 w-4 fill-gray-400 text-gray-400" />
                <span>{Number(hostel.rating || 0).toFixed(1)} rating</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{hostel.city}</span>
              </div>
            </div>

            <Separator />

            {/* Contact Options */}
            <div className="flex flex-wrap gap-3">
              {landlordPhone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 flex-1 sm:flex-none"
                  asChild
                >
                  <a href={`tel:${landlordPhone}`}>
                    <Phone className="h-4 w-4" />
                    <span>Call</span>
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 flex-1 sm:flex-none"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Message</span>
              </Button>
            </div>

            {/* Contact Info Display */}
            <div className="pt-2 space-y-2 text-sm">
              {landlordPhone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">{landlordPhone}</span>
                </div>
              )}
            </div>

            {/* Response info */}
            <div className="pt-2">
              <p className="text-xs text-gray-500">
                {isVerified
                  ? '✓ Identity verified • Usually responds within a day'
                  : 'Usually responds within a few days'}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {isVerified && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  Verified property owner
                </p>
                <p className="leading-relaxed">
                  This landlord identity has been verified by RUMI. They have
                  provided official documentation and contact information.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Safety note */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong className="text-gray-900">Safety tip:</strong> Never transfer
          money outside of the RUMI platform. Keep all communication and
          payments within the platform for your protection.
        </p>
      </div>
    </motion.section>
  );
}
