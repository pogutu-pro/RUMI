import React from 'react';
import { Link } from 'react-router-dom';

interface HostelCardProps {
  hostel: {
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
  };
}

const HostelCard: React.FC<HostelCardProps> = ({ hostel }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Hostel Image */}
      <div className="relative h-48 bg-gray-200">
        {hostel.images && hostel.images.length > 0 ? (
          <img
            src={hostel.images[0]}
            alt={hostel.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Verified Badge */}
        {hostel.is_verified && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Verified
          </div>
        )}

        {/* Availability Badge */}
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          {hostel.available_rooms} rooms available
        </div>
      </div>

      {/* Hostel Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {hostel.name}
          </h3>
          <div className="flex items-center ml-2">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm text-gray-600 ml-1">
              {hostel.rating} ({hostel.review_count})
            </span>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
          {hostel.description}
        </p>

        <p className="text-gray-500 text-sm mb-3">
          {hostel.address}
        </p>

        {/* Hostel Type */}
        <div className="flex items-center mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {hostel.hostel_type.replace('_', ' ').toUpperCase()}
          </span>
        </div>

        {/* Amenities Preview */}
        {hostel.amenities && hostel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {hostel.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
              >
                {amenity}
              </span>
            ))}
            {hostel.amenities.length > 3 && (
              <span className="text-xs text-gray-500">
                +{hostel.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price and Action */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              KES {hostel.base_price.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm">/month</span>
          </div>

          <Link
            to={`/hostels/${hostel.hostel_id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            View Details
          </Link>
        </div>

        {/* Landlord Info */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Managed by {hostel.landlord.company_name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HostelCard;