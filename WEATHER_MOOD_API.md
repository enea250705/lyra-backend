# Weather & Mood API Documentation

## Overview

The Weather & Mood API provides comprehensive functionality that correlates user mood with weather patterns, detects nearby expensive stores, and handles accurate sleep tracking across different timezones.

## Features

1. **Weather Data Integration** - Real-time weather information from OpenWeather API
2. **Mood-Weather Correlation** - Intelligent analysis of how weather affects mood
3. **Expensive Store Detection** - Location-based detection of high-end retail stores
4. **Timezone-Aware Sleep Tracking** - Accurate sleep data across different locations
5. **Comprehensive Analysis** - Combined insights from all data sources

## API Endpoints

### 1. Get Weather Data
```
GET /api/v1/weather-mood/weather?lat={latitude}&lon={longitude}
```

**Response:**
```json
{
  "temperature": 22.5,
  "humidity": 65,
  "pressure": 1013,
  "windSpeed": 3.2,
  "cloudiness": 20,
  "weatherType": "Clear",
  "uvIndex": 6,
  "visibility": 10,
  "location": {
    "city": "New York",
    "country": "US",
    "lat": 40.7128,
    "lon": -74.0060
  },
  "timezone": "America/New_York"
}
```

### 2. Correlate Mood with Weather
```
POST /api/v1/weather-mood/correlate
```

**Request Body:**
```json
{
  "mood": 7,
  "lat": 40.7128,
  "lon": -74.0060
}
```

**Response:**
```json
{
  "mood": 7,
  "weather": { /* weather data */ },
  "correlationScore": 0.65,
  "moodPrediction": "Weather conditions likely to improve your mood",
  "recommendations": [
    "Sunny weather detected - great for outdoor activities",
    "Great day for outdoor activities"
  ]
}
```

### 3. Get Nearby Expensive Stores
```
GET /api/v1/weather-mood/nearby-stores?lat={latitude}&lon={longitude}
```

**Response:**
```json
[
  {
    "name": "Gucci Store",
    "category": "luxury",
    "distance": 250,
    "priceLevel": "luxury",
    "address": "Fifth Avenue, New York"
  },
  {
    "name": "Tiffany & Co.",
    "category": "jewelry",
    "distance": 320,
    "priceLevel": "very_expensive",
    "address": "57th Street, New York"
  }
]
```

### 4. Adjust Sleep Tracking
```
POST /api/v1/weather-mood/adjust-sleep
```

**Request Body:**
```json
{
  "userId": "user123",
  "lat": 40.7128,
  "lon": -74.0060,
  "sleepData": {
    "bedtime": "2024-01-15T22:30:00Z",
    "wakeTime": "2024-01-16T07:00:00Z",
    "sleepQuality": 8
  }
}
```

**Response:**
```json
{
  "userId": "user123",
  "timezone": "America/New_York",
  "bedtime": "2024-01-15T22:30:00Z",
  "wakeTime": "2024-01-16T07:00:00Z",
  "sleepDuration": 8.5,
  "sleepQuality": 8,
  "locationAdjusted": true
}
```

### 5. Get Comprehensive Data
```
POST /api/v1/weather-mood/comprehensive
```

**Request Body:**
```json
{
  "userId": "user123",
  "lat": 40.7128,
  "lon": -74.0060,
  "currentMood": 6
}
```

**Response:**
```json
{
  "weather": { /* weather data */ },
  "moodCorrelation": { /* mood correlation data */ },
  "nearbyStores": [ /* nearby stores array */ ],
  "sleepAdjustment": { /* sleep tracking data */ },
  "recommendations": [
    "Sunny weather detected - great for outdoor activities",
    "You're in an area with many expensive stores - be mindful of impulse purchases",
    "You may need more sleep for better mood regulation"
  ]
}
```

### 6. Get Timezone Information
```
GET /api/v1/weather-mood/timezone?lat={latitude}&lon={longitude}
```

**Response:**
```json
{
  "timezone": "America/New_York"
}
```

## Required Environment Variables

Add these to your `.env` file:

```env
# Weather & Location APIs
OPENWEATHER_API_KEY=your_openweather_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

## API Key Setup

### 1. OpenWeather API
- Sign up at [OpenWeatherMap](https://openweathermap.org/api)
- Get your free API key
- Add to `OPENWEATHER_API_KEY` in `.env`

### 2. Google Places API
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable Places API
- Create credentials and get API key
- Add to `GOOGLE_PLACES_API_KEY` in `.env`

### 3. Timezone API
- Uses free [WorldTime API](https://worldtimeapi.org/)
- No API key required
- Automatic timezone detection based on coordinates and IP

## Usage Examples

### Frontend Integration

```javascript
// Get comprehensive mood and location data
const getLocationMoodData = async (lat, lon, mood) => {
  const response = await fetch('/api/v1/weather-mood/comprehensive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      userId: currentUser.id,
      lat,
      lon,
      currentMood: mood
    })
  });
  
  const data = await response.json();
  return data;
};

// Use geolocation to get user's current position
navigator.geolocation.getCurrentPosition(async (position) => {
  const { latitude, longitude } = position.coords;
  const currentMood = 7; // From user input
  
  const data = await getLocationMoodData(latitude, longitude, currentMood);
  
  // Display recommendations
  console.log('Mood recommendations:', data.recommendations);
  console.log('Nearby expensive stores:', data.nearbyStores);
  console.log('Weather correlation:', data.moodCorrelation);
});
```

### Mobile App Integration

```javascript
// React Native example
import * as Location from 'expo-location';

const getMoodInsights = async (userMood) => {
  // Get current location
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.error('Location permission denied');
    return;
  }

  const location = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = location.coords;

  // Get comprehensive data
  const response = await api.post('/weather-mood/comprehensive', {
    userId: user.id,
    lat: latitude,
    lon: longitude,
    currentMood: userMood
  });

  return response.data;
};
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```

Common error codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid token)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

The API is rate-limited to prevent abuse:
- 100 requests per 15 minutes per user
- Adjust limits in `.env` if needed

## Security

- All endpoints require authentication
- API keys are server-side only
- Location data is not stored permanently
- User data is encrypted in transit

## Future Enhancements

- Machine learning for better mood prediction
- Historical mood-weather pattern analysis
- Integration with wearable devices
- Push notifications for mood recommendations
- Social features for mood sharing