# Hostels Backend API Documentation

## Overview
Production-ready backend API for managing hostels, rooms, bookings, and inventory. Built with Django REST Framework following industry best practices.

## Database Changes ✅
All new fields have been migrated to the database:
- `university`, `city`, `gender_policy`, `distance_from_university`
- `images` (JSONField - array of URLs), `amenities` (JSONField - dictionary)
- `rules`, `has_inventory_template`, `is_active`, `rating`

## API Endpoints

### Hostels

#### `GET /api/v1/hostels/`
List all active hostels with pagination.

**Query Parameters:**
- `min_price` - Filter by minimum price
- `max_price` - Filter by maximum price  
- `hostel_type` - Filter by type (single_rooms, shared_rooms, mixed)
- `page` - Page number (default: 1)

**Response Example:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/v1/hostels/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Sunrise Hostel",
      "description": "Modern hostel near university",
      "address": "123 Main St",
      "city": "Nairobi",
      "university": "University of Nairobi",
      "distance_from_university": "1.50",
      "gender_policy": "mixed",
      "hostel_type": "mixed",
      "base_price": "15000.00",
      "currency": "KES",
      "rating": "4.50",
      "total_rooms": 50,
      "available_rooms": 12,
      "images": [
        "/images/cards/card-01.jpg",
        "/images/cards/card-02.jpg"
      ],
      "amenities_list": ["WiFi", "Security", "Parking"],
      "amenities": {"wifi": true, "parking": true},
      "landlord_name": "Property Co Ltd",
      "landlord_phone": "+254712345678",
      "is_verified": true,
      "review_count": 13
    }
  ]
}
```

#### `GET /api/v1/hostels/{id}/`
Get detailed information about a specific hostel.

#### `POST /api/v1/hostels/create/`
Create a new hostel (Landlord only, requires authentication).

**Request Body:**
```json
{
  "name": "New Hostel",
  "description": "Comfortable accommodation",
  "address": "456 Campus Road",
  "city": "Nairobi",
  "university": "University of Nairobi",
  "distance_from_university": "2.00",
  "gender_policy": "mixed",
  "hostel_type": "mixed",
  "base_price": "12000.00",
  "images": ["/images/custom/hostel1.jpg"],
  "amenities": {"wifi": true, "laundry": true},
  "rules": "No smoking. Quiet hours 10PM-6AM."
}
```

#### `GET /api/v1/hostels/search/`
Advanced search with multiple filters including university, city, gender_policy, amenities, and price range.

### Image Handling
- **Default Images**: If no images are uploaded, the API returns default card images from `/images/cards/`
- **Custom Images**: Landlords can upload images which are stored in the `images` JSONField
- **Frontend Path**: Images are served from the frontend's `public/images/` directory

## Integration Guide

### Frontend Usage Example
```typescript
// Fetch hostels
const response = await fetch('http://localhost:8000/api/v1/hostels/');
const data = await response.json();

// Each hostel will have images - either custom or defaults
data.results.forEach(hostel => {
  console.log(hostel.images); // Always contains at least 3 images
});
```

### Filtering by University
```typescript
const response = await fetch(
  'http://localhost:8000/api/v1/hostels/search/?university=Nairobi'
);
```

## Business Logic Features
- ✅ **University-based filtering** for student hostel search
- ✅ **Gender policy enforcement** (male_only, female_only, mixed)
- ✅ **Rating system** (0-5 stars)
- ✅ **Distance calculation** from university
- ✅ **Amenities tracking** (both structured JSON and relationship-based)
- ✅ **Image management** with fallback to default images
- ✅ **Inventory template tracking**

## Next Steps
Frontend implementation can now:
1. Display hostel cards with images, ratings, and amenities
2. Filter by university/city for targeted search
3. Show distance from university
4. Display gender policy for appropriate matching
5. Render hostel rules and amenities clearly

