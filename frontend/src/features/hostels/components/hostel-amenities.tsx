import { motion } from 'framer-motion';
import {
  Wifi,
  Shield,
  Zap,
  ChefHat,
  Shirt,
  Car,
  BookOpen,
  Dumbbell,
  AirVent,
  Tv,
  UtensilsCrossed,
  Lock,
  Droplet,
  Home,
  Coffee,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  WiFi: Wifi,
  Security: Shield,
  '24/7 Security': Lock,
  Electricity: Zap,
  Kitchen: ChefHat,
  Laundry: Shirt,
  Parking: Car,
  'Study Area': BookOpen,
  'Study Room': BookOpen,
  Gym: Dumbbell,
  'Air Conditioning': AirVent,
  TV: Tv,
  'Dining Area': UtensilsCrossed,
  'Water 24/7': Droplet,
  'Water ⁠24/7': Droplet,
  'Common Area': Home,
  'Lounge': Coffee,
};

interface HostelAmenitiesProps {
  amenities: string[];
}

/**
 * HostelAmenities - Display amenities with icons
 * Staggered animation for visual interest
 */
export default function HostelAmenities({ amenities }: HostelAmenitiesProps) {
  if (!amenities || amenities.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="py-12 border-t border-gray-200"
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">
        What this place offers
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {amenities.map((amenity, index) => {
          const Icon = iconMap[amenity] || Wifi;
          return (
            <motion.div
              key={`${amenity}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 flex items-center gap-3 hover:shadow-md transition-all duration-200 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/30 group">
                <Icon className="h-5 w-5 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-gray-700 text-sm group-hover:text-emerald-900 transition-colors">
                  {amenity}
                </span>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
