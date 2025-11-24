import React, { useState, useEffect } from 'react';
import HostelCard from '../components/hostels/HostelCard';
import { hostelAPI } from '../services/api';

interface Hostel {
  hostel_id: number;
  name: string;
  description: string;
  address: string;
  hostel_type: string;
  base_price: number;
  total_rooms: number;
  available_rooms: number;
  amenities: string[];
  images: string[];
  landlord: {
    company_name: string;
    phone: string;
  };
  rating: number;
  review_count: number;
  is_verified: boolean;
}

const Hostels: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHostelType, setSelectedHostelType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const hostelTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'single_rooms', label: 'Single Rooms' },
    { value: 'shared_rooms', label: 'Shared Rooms' },
    { value: 'mixed', label: 'Mixed' }
  ];

  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const response = await hostelAPI.getHostels();
      setHostels(response.data.hostels || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching hostels:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load hostels. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredHostels = hostels.filter(hostel => {
    const matchesSearch = hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hostel.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hostel.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedHostelType === 'all' || hostel.hostel_type === selectedHostelType;

    const matchesMinPrice = !minPrice || hostel.base_price >= parseInt(minPrice);
    const matchesMaxPrice = !maxPrice || hostel.base_price <= parseInt(maxPrice);

    return matchesSearch && matchesType && matchesMinPrice && matchesMaxPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Hostel</h1>
          <p className="text-xl text-gray-200">Browse verified student accommodation near your university</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search hostels by name, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={selectedHostelType}
              onChange={(e) => setSelectedHostelType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {hostelTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          </div>
        </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
  
          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
  
          {/* Results Count */}
          {!loading && !error && (
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredHostels.length} of {hostels.length} hostels
              </p>
            </div>
          )}
  
          {/* Hostels Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHostels.map((hostel) => (
                <HostelCard key={hostel.hostel_id} hostel={hostel} />
              ))}
            </div>
          )}
  
          {/* Empty State */}
          {!loading && !error && filteredHostels.length === 0 && hostels.length > 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hostels match your criteria</h3>
              <p className="text-gray-600">Try adjusting your search filters</p>
            </div>
          )}
  
          {/* No Hostels State */}
          {!loading && !error && hostels.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hostels available</h3>
              <p className="text-gray-600">Check back later for new listings</p>
            </div>
          )}
        </div>
      </div>
  );
};

export default Hostels;