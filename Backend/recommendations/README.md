# Smart Hostel Recommendation System

A hybrid recommendation engine that suggests personalized hostels to students based on their preferences, booking patterns, and similar students' choices.

## Features

- **Hybrid Approach**: Combines content-based filtering with collaborative filtering
- **Personalized Scoring**: University proximity, price compatibility, amenities matching, quality ratings
- **Real-time Recommendations**: On-demand API responses with pagination
- **Explainable AI**: Human-readable reasons for each recommendation
- **Privacy-aware**: Students can only access their own recommendations

## Architecture

```
recommendations/
├── engine.py          # Core recommendation algorithms
├── views.py           # API endpoints
├── urls.py            # URL routing
├── apps.py            # Django app config
├── tests.py           # Unit and integration tests
└── test_manual.py     # Manual testing script
```

## Algorithm Details

### Content-Based Filtering (70% weight)
- **University Match**: Proximity and relevance to student's university
- **Price Compatibility**: Budget alignment with student's preferences
- **Amenities Matching**: Preferred facilities vs available amenities
- **Gender Policy**: Compatibility with student's gender
- **Quality Score**: Review ratings and confidence factors

### Collaborative Filtering (30% weight)
- **Similar Students**: Same university/course/year combinations
- **Booking Patterns**: Popular choices among peer groups
- **Social Proof**: Aggregate preferences from similar demographics

## API Endpoints

### Get Recommendations
```
GET /api/v1/recommendations/student/{student_id}/
GET /api/v1/recommendations/student/me/
```

Query Parameters:
- `limit`: Number of recommendations (default: 10, max: 20)
- `page`: Page number for pagination (default: 1)

### Get Recommendation Stats
```
GET /api/v1/recommendations/stats/{student_id}/
GET /api/v1/recommendations/stats/me/
```

Returns student preferences, booking patterns, and recommendation readiness metrics.

## Response Format

```json
{
  "student_id": 123,
  "recommendations": [
    {
      "hostel": {
        "id": 456,
        "name": "Great Student Hostel",
        "base_price": 12000.00,
        "rating": 4.2,
        "review_count": 15,
        "available_rooms": 3,
        "images": ["url1", "url2"]
      },
      "score": 0.85,
      "reasons": ["Near your university", "Well within your budget", "Highly rated"],
      "price_compatibility": "Great Value"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_count": 25,
    "total_pages": 3
  },
  "meta": {
    "algorithm": "hybrid_content_collaborative",
    "content_weight": 0.7,
    "collaborative_weight": 0.3,
    "generated_at": "2026-02-04T12:00:00Z"
  }
}
```

## Testing

### Unit Tests
```bash
python manage.py test recommendations
```

### Manual Testing
```bash
cd Backend
python recommendations/test_manual.py
```

### API Testing (with server running)
```bash
# Get current user's recommendations
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/recommendations/student/me/

# Get recommendation stats
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/v1/recommendations/stats/me/
```

## Performance Considerations

### Current Implementation
- **Real-time calculation**: Recommendations computed on-demand
- **Database queries**: Optimized with select_related/prefetch_related
- **Caching**: None (suitable for current scale)

### Future Optimizations
- **Pre-computation**: Batch processing for popular students
- **Redis caching**: Cache frequent recommendations
- **Model optimization**: Feature vectors stored in database
- **Async processing**: Celery tasks for heavy computations

## Data Requirements

### Student Profile Data
- `university`: Essential for location matching
- `course`: Used for similarity calculations
- `year_of_study`: Budget and preference heuristics
- `lifestyle_preferences.max_monthly_rent`: Price compatibility
- `lifestyle_preferences.preferred_amenities`: Amenity matching

### Hostel Data
- `university`/`city`: Location matching
- `base_price`: Price compatibility
- `gender_policy`: Filtering
- `rating`/`review_count`: Quality scoring
- `available_rooms`: Availability filtering

### Behavioral Data
- `Booking`: Collaborative filtering patterns
- `Review`: Quality signals and sentiment
- `AnalyticsEvent`: Implicit feedback (future enhancement)

## Limitations & Future Improvements

### Current Limitations
- **Cold Start**: New students get only content-based recommendations
- **Data Sparsity**: Limited collaborative data with few bookings
- **Real-time Latency**: On-demand computation may be slow at scale
- **Simple Features**: Basic heuristics for price and preferences

### Planned Enhancements
- **Advanced NLP**: Sentiment analysis of review comments
- **Time-based Features**: Seasonal preferences and availability patterns
- **Geospatial Features**: Actual distance calculations
- **Learning-to-Rank**: ML models for optimal ranking
- **A/B Testing**: Framework for algorithm improvements

## Integration Notes

### Frontend Integration
- Call `/api/v1/recommendations/student/me/` for authenticated students
- Display top 3-5 recommendations on homepage/search results
- Show recommendation reasons to build trust
- Track recommendation clicks for future optimization

### Monitoring
- Log recommendation requests and responses
- Track recommendation click-through rates
- Monitor API response times
- Alert on recommendation failures

## Security & Privacy

- **Authentication**: All endpoints require valid JWT tokens
- **Authorization**: Students can only access their own recommendations
- **Data Privacy**: No sensitive personal data exposed in recommendations
- **Rate Limiting**: Consider implementing for API protection
