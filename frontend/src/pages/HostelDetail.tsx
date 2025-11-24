import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  StarIcon,
  WifiIcon,
  TvIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  HomeIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';

interface Room {
  room_id: number;
  room_number: string;
  room_type: string;
  price: number;
  is_available: boolean;
  capacity: number;
  floor: number;
}

interface Review {
  id: number;
  student_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

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
    email: string;
  };
  rating: number;
  review_count: number;
  is_verified: boolean;
  nearby_facilities: string[];
  house_rules: string[];
  rooms?: Room[];
  reviews?: Review[];
}

const HostelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchHostelDetails();
  }, [id]);

  const fetchHostelDetails = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      const mockHostel: Hostel = {
        hostel_id: parseInt(id || '1'),
        name: 'Sunview Student Residence',
        description: 'Modern student accommodation with excellent facilities near the University of Nairobi. Our hostel provides a safe, comfortable environment perfect for focused studying and social interaction.',
        address: '123 University Way, Nairobi',
        hostel_type: 'mixed',
        base_price: 8000,
        total_rooms: 50,
        available_rooms: 12,
        amenities: ['WiFi', 'Study Rooms', 'Laundry', 'Security', 'Parking', 'Common Kitchen', 'TV Lounge', 'Gym'],
        images: [
          '/api/placeholder/800/600',
          '/api/placeholder/800/600',
          '/api/placeholder/800/600',
          '/api/placeholder/800/600'
        ],
        landlord: {
          company_name: 'StudentHomes Ltd',
          phone: '+254 712 345 678',
          email: 'info@studenthomes.co.ke'
        },
        rating: 4.5,
        review_count: 87,
        is_verified: true,
        nearby_facilities: ['University of Nairobi (5 min)', 'Supermarket (2 min)', 'Hospital (10 min)', 'Bus Stop (3 min)'],
        house_rules: [
          'No overnight guests',
          'Quiet hours: 10 PM - 7 AM',
          'No smoking indoors',
          'Respect common areas',
          'Report maintenance issues promptly'
        ],
        rooms: [
          { room_id: 1, room_number: '101', room_type: 'Single', price: 10000, is_available: true, capacity: 1, floor: 1 },
          { room_id: 2, room_number: '102', room_type: 'Double', price: 8000, is_available: true, capacity: 2, floor: 1 },
          { room_id: 3, room_number: '201', room_type: 'Single', price: 10000, is_available: false, capacity: 1, floor: 2 },
          { room_id: 4, room_number: '202', room_type: 'Triple', price: 6500, is_available: true, capacity: 3, floor: 2 }
        ],
        reviews: [
          {
            id: 1,
            student_name: 'John Kamau',
            rating: 5,
            comment: 'Excellent hostel with great facilities. The management is very responsive and the security is top-notch.',
            created_at: '2025-10-15T10:00:00Z'
          },
          {
            id: 2,
            student_name: 'Mary Wanjiku',
            rating: 4,
            comment: 'Good place to stay. Close to campus and the rooms are clean. WiFi could be faster though.',
            created_at: '2025-10-10T14:30:00Z'
          },
          {
            id: 3,
            student_name: 'Peter Ochieng',
            rating: 5,
            comment: 'Best hostel I\'ve stayed in! The study rooms are quiet and the community is friendly.',
            created_at: '2025-10-05T09:15:00Z'
          }
        ]
      };
      
      setHostel(mockHostel);
      setError(null);
    } catch (err) {
      console.error('Error fetching hostel:', err);
      setError('Failed to load hostel details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = (room: Room) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedRoom(room);
    setShowBookingForm(true);
  };

  const handleContactLandlord = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Handle contact logic
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hostel Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The hostel you\'re looking for doesn\'t exist.'}</p>
          <Link to="/hostels" className="text-blue-600 hover:text-blue-800 font-medium">
            ← Back to Hostels
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/hostels" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Hostels
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="grid grid-cols-4 gap-2 p-4">
            <div className="col-span-4 md:col-span-3">
              <img
                src={hostel.images[selectedImage]}
                alt={hostel.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
            <div className="col-span-4 md:col-span-1 grid grid-cols-4 md:grid-cols-1 gap-2">
              {hostel.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${hostel.name} ${index + 1}`}
                  className={`h-24 object-cover rounded-lg cursor-pointer ${
                    selectedImage === index ? 'ring-2 ring-blue-600' : ''
                  }`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{hostel.name}</h1>
                    {hostel.is_verified && (
                      <ShieldCheckIcon className="w-6 h-6 text-blue-600 ml-2" title="Verified" />
                    )}
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    <span>{hostel.address}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(hostel.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-gray-700 font-medium">
                        {hostel.rating} ({hostel.review_count} reviews)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {isSaved ? (
                      <HeartSolidIcon className="w-6 h-6 text-red-500" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                  <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <ShareIcon className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">{hostel.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hostel.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Rooms */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Rooms</h2>
              <div className="space-y-4">
                {hostel.rooms?.map((room) => (
                  <div
                    key={room.room_id}
                    className={`border rounded-lg p-4 ${
                      room.is_available ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Room {room.room_number} - {room.room_type}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Floor {room.floor} • Capacity: {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                        </p>
                        <p className="text-lg font-bold text-blue-600 mt-2">
                          KSh {room.price.toLocaleString()}/month
                        </p>
                      </div>
                      <div>
                        {room.is_available ? (
                          <button
                            onClick={() => handleBookRoom(room)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                          >
                            Book Now
                          </button>
                        ) : (
                          <span className="text-gray-500 font-medium">Occupied</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Reviews</h2>
              <div className="space-y-4">
                {hostel.reviews?.map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{review.student_name}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">House Rules</h2>
              <ul className="space-y-2">
                {hostel.house_rules.map((rule, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Price Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center mb-4">
                  <p className="text-gray-600">Starting from</p>
                  <p className="text-3xl font-bold text-blue-600">
                    KSh {hostel.base_price.toLocaleString()}
                  </p>
                  <p className="text-gray-500">per month</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Available Rooms</span>
                    <span className="font-semibold text-gray-900">
                      {hostel.available_rooms}/{hostel.total_rooms}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Type</span>
                    <span className="font-semibold text-gray-900 capitalize">{hostel.hostel_type}</span>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Landlord</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Company</p>
                    <p className="font-semibold text-gray-900">{hostel.landlord.company_name}</p>
                  </div>
                  <button
                    onClick={handleContactLandlord}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <PhoneIcon className="w-5 h-5 mr-2" />
                    Call: {hostel.landlord.phone}
                  </button>
                  <button
                    onClick={handleContactLandlord}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  >
                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                    Email Landlord
                  </button>
                </div>
              </div>

              {/* Nearby Facilities */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Nearby Facilities</h3>
                <ul className="space-y-2">
                  {hostel.nearby_facilities.map((facility, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <MapPinIcon className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelDetail;