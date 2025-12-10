'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Info, Sparkles } from 'lucide-react';

interface HostelInfoProps {
  description: string;
  houseRules?: string;
}

const DESCRIPTION_PREVIEW_LENGTH = 300;

export default function HostelInfo({
  description,
  houseRules,
}: HostelInfoProps) {
  const [showMore, setShowMore] = useState(false);
  const shouldTruncate = description.length > DESCRIPTION_PREVIEW_LENGTH;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      className="py-12 border-t border-gray-200"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          About this place
        </h2>
      </div>
      
      <div className="prose prose-gray max-w-none">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-base md:text-lg leading-8 text-gray-700 ${
            !showMore && shouldTruncate ? 'line-clamp-6' : ''
          }`}
        >
          {description}
        </motion.p>
        
        {shouldTruncate && (
          <Button
            variant="link"
            onClick={() => setShowMore(!showMore)}
            className="mt-4 p-0 h-auto font-semibold text-emerald-600 hover:text-emerald-700 underline-offset-4 group"
          >
            <span className="mr-1">{showMore ? 'Show less' : 'Show more'}</span>
            <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
          </Button>
        )}
      </div>

      {houseRules && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mt-10 p-6 border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 backdrop-blur-sm hover:border-emerald-200 transition-all duration-300">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0 mt-0.5">
                <Info className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                House rules
              </h3>
            </div>
            <div className="pl-12">
              <p className="whitespace-pre-line text-gray-700 leading-7">
                {houseRules}
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.section>
  );
}
