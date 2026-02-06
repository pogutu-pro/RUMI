import { motion } from 'framer-motion';
import { HostelCard } from './hostel-card';
import type { Hostel } from '@/types/entities.types';

interface HostelGridProps {
  hostels: Hostel[];
  className?: string;
  basePath?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
};

export default function HostelGrid({ hostels, className, basePath }: HostelGridProps) {
  console.log('🏠 HostelGrid Debug:', { 
    hostelsLength: hostels?.length || 0, 
    hostels: hostels?.slice(0, 2) // Show first 2 for debugging
  });
  
  if (!hostels || hostels.length === 0)
    return (
      <p className="text-center text-gray-500 py-12" role="status">
        No hostels found
      </p>
    );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-10${typeof className === 'string' ? ` ${className}` : ''}`}
      aria-label="Hostel grid"
    >
      {hostels.map((hostel) => (
        <motion.div key={hostel.id} variants={item}>
          <HostelCard hostel={hostel} basePath={basePath} />
        </motion.div>
      ))}
    </motion.div>
  );
}
