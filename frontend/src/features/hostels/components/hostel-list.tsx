import { motion } from 'framer-motion';
import { HostelCard } from './hostel-card';
import type { Hostel } from '@/types/entities.types';


interface HostelListProps {
  hostels: Hostel[];
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  basePath?: string;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export function HostelList({
  hostels,
  orientation = 'vertical',
  className,
  basePath,
}: HostelListProps) {
  if (!hostels || hostels.length === 0)
    return <p className="text-center text-gray-500 py-12" role="status">No hostels found</p>;

  return (
    <motion.ul
      variants={listVariants}
      initial="hidden"
      animate="show"
      className={
        `${orientation === 'horizontal'
          ? 'flex overflow-x-auto gap-6 pb-4'
          : 'space-y-6'} ${className ?? ''}`
      }
      aria-label="Hostel list"
    >
      {hostels.map((hostel) => (
        <li key={hostel.id}>
          <HostelCard hostel={hostel} basePath={basePath} />
        </li>
      ))}
    </motion.ul>
  );
}
