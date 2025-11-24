import React from 'react';
import { Link } from 'react-router-dom';

interface RoomCardProps {
  room: {
    room_id: number;
    hostel_name: string;
    room_number: string;
    capacity: number;
    base_price: number;
    room_type: string;
    floor: number | null;
    amenities: string[];
    description: string | null;
    images: string[];
    hostel_type: string;
    is_available: boolean;
    compatibility_score: number;
  };
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const getRoomTypeColor = (roomType: string) => {
    switch (roomType) {
      case 'single':
        return 'bg-green-100 text-green-800';
      case 'double':
        return 'bg-blue-100 text-blue-800';
      case 'triple':
        return 'bg-yellow-100 text-yellow-800';
      case 'quad':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Room Image */}
      <div className="relative h-48 bg-gray-200">
        {room.images && room.images.length > 0 ? (
          <img
            src={room.images[0]}
            alt={`Room ${room.room_number}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}

        {/* Availability Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
          room.is_available
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {room.is_available ? 'Available' : 'Occupied'}
        </div>

        {/* Compatibility Score */}
        {room.compatibility_score > 0 && (
          <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium text-gray-800">
            {room.compatibility_score}% match
          </div>
        )}
      </div>

      {/* Room Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Room {room.room_number}
            </h3>
            <p className="text-sm text-gray-600">{room.hostel_name}</p>
          </div>

          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoomTypeColor(room.room_type)}`}>
            {room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
          </div>

          {room.floor && (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
              Floor {room.floor}
            </div>
          )}
        </div>

        {room.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {room.description}
          </p>
        )}

        {/* Amenities Preview */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {room.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 3 && (
              <span className="text-xs text-gray-500">
                +{room.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Price and Action */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              KES {room.base_price.toLocaleString()}
            </span>
            <span className="text-gray-500 text-sm">/month</span>
          </div>

          <Link
            to={`/rooms/${room.room_id}`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              room.is_available
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            onClick={(e) => !room.is_available && e.preventDefault()}
          >
            {room.is_available ? 'View Details' : 'Occupied'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;