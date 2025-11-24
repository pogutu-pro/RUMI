import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  HeartIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface Hostel {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  university: string;
  latitude: number;
  longitude: number;
  total_rooms: number;
  available_rooms: number;
  base_price: number;
  currency: string;
  rating: number;
  review_count: number;
  images: string[];
  amenities: string[];
  gender_policy: 'male' | 'female' | 'mixed';
  distance_from_university: number;
  is_verified: boolean;
  landlord_name: string;
}

interface SearchFilters {
  location: string;
  university: string;
  minPrice: string;
  maxPrice: string;
  roomType: string;
  genderPolicy: string;
  amenities: string[];
  verified: boolean;
}

const BrowseHostels: React.FC = () => {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [filteredHostels, setFilteredHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    university: '',
    minPrice: '',
    maxPrice: '',
    roomType: '',
    genderPolicy: '',
    amenities: [],
    verified: false
  });

  const roomTypes = ['Single Room', 'Shared Room', 'Studio', 'Apartment'];
  const genderPolicies = ['Mixed', 'Male Only', 'Female Only'];
  const amenityOptions = [
    'WiFi', 'Laundry', 'Security', 'Mess Hall', 'Study Room', 
    'Gym', 'Cafeteria', 'Parking', 'Backup Power', 'Water Backup'
  ];

  useEffect(() => {
    fetchHostels();
    // Load wishlist from localStorage
    const savedWishlist = localStorage.getItem('rumi_wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [hostels, searchQuery, filters]);

  const fetchHostels = async () => {
    try {
      // Mock data for demonstration - in real app, this would come from API
      const mockHostels: Hostel[] = [
        {
          id: '1',
          name: 'University View Hostel',
          description: 'Modern hostel with excellent views and premium amenities located just 5 minutes from the main campus.',
          address: '123 University Road',
          city: 'Nairobi',
          university: 'University of Nairobi',
          latitude: -1.2921,
          longitude: 36.8219,
          total_rooms: 50,
          available_rooms: 12,
          base_price: 15000,
          currency: 'KES',
          rating: 4.5,
          review_count: 28,
          images: [
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
          ],
          amenities: ['WiFi', 'Laundry', 'Security', 'Mess Hall', 'Study Room'],
          gender_policy: 'mixed',
          distance_from_university: 0.5,
          is_verified: true,
          landlord_name: 'John Smith Properties'
        },
        {
          id: '2',
          name: 'Green Valley Residence',
          description: 'Eco-friendly hostel with sustainable practices and beautiful gardens.',
          address: '456 Green Valley Ave',
          city: 'Nairobi',
          university: 'Kenyatta University',
          latitude: -1.2800,
          longitude: 36.8400,
          total_rooms: 30,
          available_rooms: 8,
          base_price: 12000,
          currency: 'KES',
          rating: 4.2,
          review_count: 15,
          images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
          ],
          amenities: ['WiFi', 'Parking', 'Gym', 'Cafeteria', 'Water Backup'],
          gender_policy: 'female',
          distance_from_university: 2.1,
          is_verified: true,
          landlord_name: 'Green Properties Ltd'
        },
        {
          id: '3',
          name: 'Sunrise Hostel',
          description: 'Budget-friendly accommodation with basic amenities and great community spirit.',
          address: '789 Sunrise Street',
          city: 'Nairobi',
          university: 'Strathmore University',
          latitude: -1.3200,
          longitude: 36.8100,
          total_rooms: 40,
          available_rooms: 15,
          base_price: 8000,
          currency: 'KES',
          rating: 3.8,
          review_count: 42,
          images: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
            'https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=800'
          ],
          amenities: ['WiFi', 'Security', 'Backup Power'],
          gender_policy: 'male',
          distance_from_university: 1.8,
          is_verified: false,
          landlord_name: 'Sunrise Management'
        },
        {
          id: '4',
          name: 'Skyline Towers',
          description: 'Luxury hostel accommodation with panoramic city views and premium facilities.',
          address: '321 Skyline Boulevard',
          city: 'Nairobi',
          university: 'United States International University',
          latitude: -1.2700,
          longitude: 36.8000,
          total_rooms: 25,
          available_rooms: 5,
          base_price: 25000,
          currency: 'KES',
          rating: 4.8,
          review_count: 12,
          images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
          ],
          amenities: ['WiFi', 'Laundry', 'Security', 'Gym', 'Parking', 'Backup Power'],
          gender_policy: 'mixed',
          distance_from_university: 3.2,
          is_verified: true,
          landlord_name: 'Skyline Properties'
        }
      ];

      setHostels(mockHostels);
    } catch (error) {
      console.error('Failed to fetch hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...hostels];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(hostel =>
        hostel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hostel.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hostel.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hostel.university.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter(hostel => hostel.base_price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(hostel => hostel.base_price <= parseInt(filters.maxPrice));
    }

    // Room type filter
    if (filters.roomType) {
      filtered = filtered.filter(hostel => 
        hostel.amenities.some(amenity => amenity.includes(filters.roomType))
      );
    }

    // Gender policy filter
    if (filters.genderPolicy) {
      filtered = filtered.filter(hostel => 
        hostel.gender_policy === filters.genderPolicy.toLowerCase().replace(' ', '_')
      );
    }

    // Verified filter
    if (filters.verified) {
      filtered = filtered.filter(hostel => hostel.is_verified);
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(hostel =>
        filters.amenities.every(amenity => hostel.amenities.includes(amenity))
      );
    }

    setFilteredHostels(filtered);
  };

  const handleWishlistToggle = (hostelId: string) => {
    const newWishlist = wishlist.includes(hostelId)
      ? wishlist.filter(id => id !== hostelId)
      : [...wishlist, hostelId];
    
    setWishlist(newWishlist);
    localStorage.setItem('rumi_wishlist', JSON.stringify(newWishlist));
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const getGenderPolicyColor = (policy: string) => {
    switch (policy) {
      case 'mixed': return 'bg-success-100 text-success-800';
      case 'female': return 'bg-accent-100 text-accent-800';
      case 'male': return 'bg-primary-100 text-primary-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-accent-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Hostels</h1>
              <p className="text-gray-600 mt-1">Find your perfect accommodation</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {filteredHostels.length} of {hostels.length} hostels
              </span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, location, university..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="KSh 0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="KSh 50000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender Policy</label>
                <select
                  value={filters.genderPolicy}
                  onChange={(e) => setFilters({...filters, genderPolicy: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                >
                  <option value="">All</option>
                  {genderPolicies.map(policy => (
                    <option key={policy} value={policy}>{policy}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="verified"
                  checked={filters.verified}
                  onChange={(e) => setFilters({...filters, verified: e.target.checked})}
                  className="h-4 w-4 text-secondary-600 focus:ring-secondary-500 border-gray-300 rounded"
                />
                <label htmlFor="verified" className="ml-2 block text-sm text-gray-900">
                  Verified only
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map(amenity => (
                  <button
                    key={amenity}
                    onClick={() => {
                      const newAmenities = filters.amenities.includes(amenity)
                        ? filters.amenities.filter(a => a !== amenity)
                        : [...filters.amenities, amenity];
                      setFilters({...filters, amenities: newAmenities});
                    }}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      filters.amenities.includes(amenity)
                        ? 'bg-secondary-100 border-secondary-300 text-secondary-800'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setFilters({
                  location: '',
                  university: '',
                  minPrice: '',
                  maxPrice: '',
                  roomType: '',
                  genderPolicy: '',
                  amenities: [],
                  verified: false
                })}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Hostels Grid */}
        {filteredHostels.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No hostels found matching your criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  location: '',
                  university: '',
                  minPrice: '',
                  maxPrice: '',
                  roomType: '',
                  genderPolicy: '',
                  amenities: [],
                  verified: false
                });
              }}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHostels.map((hostel) => (
              <div key={hostel.id} className="bg-white rounded-lg shadow border overflow-hidden hover:shadow-lg transition-shadow">
                {/* Hostel Image */}
                <div className="relative h-48">
                  <img
                    src={hostel.images[0]}
                    alt={hostel.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex space-x-2">
                    {hostel.is_verified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGenderPolicyColor(hostel.gender_policy)}`}>
                      {hostel.gender_policy === 'mixed' ? 'Mixed' : 
                       hostel.gender_policy === 'female' ? 'Female Only' : 'Male Only'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleWishlistToggle(hostel.id)}
                    className="absolute top-3 right-3 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                  >
                    {wishlist.includes(hostel.id) ? (
                      <HeartSolidIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Hostel Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {hostel.name}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {getRatingStars(hostel.rating)}
                      <span className="text-sm text-gray-500 ml-1">({hostel.review_count})</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {hostel.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      <span>{hostel.address}, {hostel.city}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      <span>{hostel.available_rooms} of {hostel.total_rooms} rooms available</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      <span>{formatCurrency(hostel.base_price)}/month</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {hostel.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {amenity}
                      </span>
                    ))}
                    {hostel.amenities.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{hostel.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/student/hostel/${hostel.id}`}
                      className="flex-1 bg-primary-600 text-white text-center py-2 px-4 rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
                    >
                      View Details
                    </Link>
                    <button className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 font-medium text-sm transition-colors">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BrowseHostels;