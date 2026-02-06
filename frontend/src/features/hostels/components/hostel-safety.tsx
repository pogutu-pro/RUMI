'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Cctv, FireExtinguisher, Footprints, Moon, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface HostelSafetyProps {
  features: string[];
}

const safetyIcons: Record<string, any> = {
  cctv: Cctv,
  security_guard: ShieldCheck,
  fire_exits: Footprints,
  fire_extinguisher: FireExtinguisher,
  curfew: Moon,
  visitor_rules: Users,
  gated: Lock,
  well_lit: Lock, // Fallback
};

const safetyLabels: Record<string, string> = {
  cctv: 'CCTV Surveillance',
  security_guard: '24/7 Security Guard',
  fire_exits: 'Marked Fire Exits',
  fire_extinguisher: 'Fire Extinguishers',
  curfew: 'Curfew Enforced',
  visitor_rules: 'Visitor Registration',
  gated: 'Gated Compound',
  well_lit: 'Well Lit Areas',
};

export default function HostelSafety({ features }: HostelSafetyProps) {
  if (!features || features.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="py-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Safety & Security
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = safetyIcons[feature] || ShieldCheck;
          return (
            <Card key={feature} className="p-4 flex items-center gap-3 border-gray-200 hover:border-blue-200 transition-colors">
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">
                {safetyLabels[feature] || feature.replace(/_/g, ' ')}
              </span>
            </Card>
          );
        })}
      </div>
    </motion.section>
  );
}
