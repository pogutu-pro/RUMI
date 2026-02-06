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
  Check,
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
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Managed by
        </h2>
        {isVerified && (
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1">
            <Shield className="h-3 w-3 mr-1.5" />
            Verified Partner
          </Badge>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Landlord Profile */}
        <div className="md:col-span-2">
           <Card className="p-6 border-0 shadow-lg bg-white/50 backdrop-blur-sm">
            <div className="flex items-start gap-6">
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
                {isVerified && (
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{landlordName}</h3>
                <p className="text-sm text-gray-500 mb-4">Joined {new Date().getFullYear()}</p>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {hostel.landlord_info ? (
                     <>
                        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1">Trust Score</p>
                          <p className="text-xl font-black text-emerald-700">{hostel.landlord_info.trust_score}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Response Rate</p>
                          <p className="text-lg font-bold text-gray-900">{hostel.landlord_info.response_rate}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Reply Time</p>
                          <p className="text-lg font-bold text-gray-900 text-ellipsis overflow-hidden whitespace-nowrap">{hostel.landlord_info.average_response_time}</p>
                        </div>
                     </>
                  ) : (
                    <div className="col-span-3 text-sm text-gray-500 italic">Metrics gathering in progress...</div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                   {landlordPhone && (
                     <Button className="bg-slate-900 text-white hover:bg-slate-800 gap-2 shadow-lg shadow-slate-200" asChild>
                        <a href={`tel:${landlordPhone}`}>
                          <Phone className="h-4 w-4" />
                          Call Host
                        </a>
                     </Button>
                   )}
                   <Button variant="outline" className="border-slate-200 hover:bg-slate-50 gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Message
                   </Button>
                </div>
              </div>
            </div>
           </Card>
        </div>

        {/* Caretaker / On-Site Support */}
        <div className="md:col-span-1">
          <Card className="h-full p-6 border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 text-emerald-700">
                  <User className="h-5 w-5" />
                  <span className="font-bold uppercase tracking-wider text-xs">On-Site Support</span>
              </div>
              
              {hostel.caretaker_name ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Caretaker</p>
                    <p className="text-lg font-semibold text-gray-900">{hostel.caretaker_name}</p>
                  </div>
                  {hostel.caretaker_phone && (
                     <div>
                        <p className="text-sm text-gray-500 mb-1">Direct Line</p>
                        <p className="font-mono text-gray-700">{hostel.caretaker_phone}</p>
                     </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Direct landlord management.</p>
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200">
               <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                     Payments are held in escrow until you verify the room condition.
                  </p>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.section>
  );
}
