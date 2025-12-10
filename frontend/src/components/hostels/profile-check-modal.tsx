'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';

interface ProfileCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProfile: () => void;
  hostelName: string;
}

/**
 * ProfileCheckModal - Prompts user to create student profile before booking
 * Part of the RUMI student flow: profile creation is required for bookings
 */
export default function ProfileCheckModal({
  isOpen,
  onClose,
  onCreateProfile,
  hostelName,
}: ProfileCheckModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <User className="h-8 w-8 text-emerald-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Create Your Student Profile
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            To continue with your booking at <strong>{hostelName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Why profile is needed */}
          <Alert className="border-emerald-200 bg-emerald-50">
            <Info className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-sm text-emerald-900">
              <strong>Why we need this:</strong> Your profile helps landlords verify your identity
              and ensures a secure booking process for everyone.
            </AlertDescription>
          </Alert>

          {/* What's required */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Quick profile setup (2 minutes):
            </h4>
            <div className="space-y-2">
              {[
                'Full name and contact details',
                'Student ID and institution',
                'Profile photo (optional)',
                'Emergency contact',
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-900 mb-1">Your data is secure</p>
              <p>We use industry-standard encryption to protect your personal information.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Maybe later
          </Button>
          <Button
            onClick={onCreateProfile}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            Create Profile
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-gray-500 pt-2">
          Your booking will be saved. You can return to complete it after creating your profile.
        </p>
      </DialogContent>
    </Dialog>
  );
}
