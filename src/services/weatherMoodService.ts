import axios from 'axios';
import logger from '../utils/logger';

// OpenWeatherMap API response interfaces
interface OpenWeatherResponse {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
  };
  clouds: {
    all: number;
  };
  weather: Array<{
    main: string;
  }>;
  visibility: number;
  name: string;
  sys: {
    country: string;
  };
  coord: {
    lat: number;
    lon: number;
  };
  timezone: number;
}

interface UVResponse {
  value: number;
}

interface WorldTimeAPIResponse {
  timezone: string;
}

interface GooglePlacesResponse {
  results: Array<{
    name: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
    types: string[];
    rating?: number;
    vicinity: string;
    price_level?: number;
  }>;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  cloudiness: number;
  weatherType: string;
  uvIndex: number;
  visibility: number;
  location: {
    city: string;
    country: string;
    lat: number;
    lon: number;
  };
  timezone: string;
}

interface MoodWeatherCorrelation {
  mood: number;
  weather: WeatherData;
  correlationScore: number;
  moodPrediction: string;
  recommendations: string[];
}

interface LocationData {
  lat: number;
  lon: number;
  timestamp: Date;
  nearbyStores: ExpensiveStore[];
}

interface ExpensiveStore {
  name: string;
  category: string;
  distance: number;
  priceLevel: 'expensive' | 'very_expensive' | 'luxury';
  address: string;
}

interface SleepTrackingData {
  userId: string;
  timezone: string;
  bedtime: Date;
  wakeTime: Date;
  sleepDuration: number;
  sleepQuality: number;
  locationAdjusted: boolean;
}

class WeatherMoodService {
  private readonly WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
  private readonly GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
  
  private readonly EXPENSIVE_STORE_KEYWORDS = [
    'luxury', 'premium', 'high-end', 'designer', 'boutique',
    'Gucci', 'Louis Vuitton', 'Prada', 'Chanel', 'Hermès',
    'Rolex', 'Cartier', 'Tiffany', 'Nordstrom', 'Saks',
    'Bergdorf Goodman', 'Neiman Marcus', 'jewelry', 'watches'
  ];

  private convertTimezoneOffsetToString(offsetSeconds: number): string {
    const offsetHours = offsetSeconds / 3600;
    const sign = offsetHours >= 0 ? '+' : '-';
    const absHours = Math.abs(offsetHours);
    const hours = Math.floor(absHours);
    const minutes = Math.round((absHours - hours) * 60);
    
    if (minutes === 0) {
      return `UTC${sign}${hours}`;
    } else {
      return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  async getWeatherData(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await axios.get<OpenWeatherResponse>(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            lat,
            lon,
            appid: this.WEATHER_API_KEY,
            units: 'metric'
          }
        }
      );

      const data = response.data;
      const uvResponse = await axios.get<UVResponse>(
        `https://api.openweathermap.org/data/2.5/uvi`,
        {
          params: {
            lat,
            lon,
            appid: this.WEATHER_API_KEY
          }
        }
      );

      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        cloudiness: data.clouds.all,
        weatherType: data.weather[0].main,
        uvIndex: uvResponse.data.value,
        visibility: data.visibility / 1000,
        location: {
          city: data.name,
          country: data.sys.country,
          lat: data.coord.lat,
          lon: data.coord.lon
        },
        timezone: this.convertTimezoneOffsetToString(data.timezone)
      };
    } catch (error) {
      logger.error('Error fetching weather data:', error);
      throw new Error('Failed to fetch weather data');
    }
  }

  async getTimezoneData(lat: number, lon: number): Promise<string> {
    try {
      const response = await axios.get<string[]>(
        `https://worldtimeapi.org/api/timezone`
      );

      const timezones = response.data;
      
      // Find the closest timezone based on coordinates
      // For simplicity, we'll use a basic approach - in production, use a proper timezone lookup
      const response2 = await axios.get<WorldTimeAPIResponse>(
        `https://worldtimeapi.org/api/ip`
      );

      // If we can't determine from IP, try a coordinate-based approach
      if (response2.data && response2.data.timezone) {
        return response2.data.timezone;
      }

      // Fallback to UTC
      return 'UTC';
    } catch (error) {
      logger.error('Error fetching timezone data:', error);
      // Try alternative approach with coordinates
      try {
        // Simple coordinate-based timezone detection
        const timezone = this.getTimezoneFromCoordinates(lat, lon);
        return timezone;
      } catch (fallbackError) {
        logger.error('Fallback timezone detection failed:', fallbackError);
        return 'UTC';
      }
    }
  }

  private getTimezoneFromCoordinates(lat: number, lon: number): string {
    // Basic timezone detection based on longitude
    // This is a simplified approach - in production, use a proper timezone library
    const timezoneOffset = Math.round(lon / 15);
    
    // Map common coordinates to timezones
    if (lat >= 24 && lat <= 49 && lon >= -125 && lon <= -66) {
      // United States
      if (lon >= -84) return 'America/New_York';
      if (lon >= -104) return 'America/Chicago';
      if (lon >= -114) return 'America/Denver';
      return 'America/Los_Angeles';
    } else if (lat >= 49 && lat <= 83 && lon >= -141 && lon <= -52) {
      // Canada
      if (lon >= -90) return 'America/Toronto';
      if (lon >= -102) return 'America/Winnipeg';
      if (lon >= -114) return 'America/Edmonton';
      return 'America/Vancouver';
    } else if (lat >= 35 && lat <= 71 && lon >= -10 && lon <= 40) {
      // Europe
      if (lon >= -5 && lon <= 2) return 'Europe/London';
      if (lon >= 2 && lon <= 15) return 'Europe/Paris';
      if (lon >= 15 && lon <= 25) return 'Europe/Berlin';
      return 'Europe/Moscow';
    } else if (lat >= 20 && lat <= 50 && lon >= 70 && lon <= 140) {
      // Asia
      if (lon >= 70 && lon <= 90) return 'Asia/Kolkata';
      if (lon >= 90 && lon <= 120) return 'Asia/Shanghai';
      if (lon >= 120 && lon <= 140) return 'Asia/Tokyo';
      return 'Asia/Dubai';
    } else if (lat >= -45 && lat <= -10 && lon >= 110 && lon <= 180) {
      // Australia
      if (lon >= 110 && lon <= 130) return 'Australia/Perth';
      if (lon >= 130 && lon <= 140) return 'Australia/Adelaide';
      if (lon >= 140 && lon <= 155) return 'Australia/Sydney';
      return 'Australia/Sydney';
    }
    
    // Default based on longitude
    if (timezoneOffset >= -12 && timezoneOffset <= 12) {
      const timezoneMap: { [key: number]: string } = {
        '-12': 'Pacific/Auckland',
        '-11': 'Pacific/Midway',
        '-10': 'Pacific/Honolulu',
        '-9': 'America/Anchorage',
        '-8': 'America/Los_Angeles',
        '-7': 'America/Denver',
        '-6': 'America/Chicago',
        '-5': 'America/New_York',
        '-4': 'America/Santiago',
        '-3': 'America/Sao_Paulo',
        '-2': 'Atlantic/South_Georgia',
        '-1': 'Atlantic/Azores',
        '0': 'Europe/London',
        '1': 'Europe/Paris',
        '2': 'Europe/Berlin',
        '3': 'Europe/Moscow',
        '4': 'Asia/Dubai',
        '5': 'Asia/Karachi',
        '6': 'Asia/Dhaka',
        '7': 'Asia/Bangkok',
        '8': 'Asia/Shanghai',
        '9': 'Asia/Tokyo',
        '10': 'Australia/Sydney',
        '11': 'Pacific/Noumea',
        '12': 'Pacific/Auckland'
      };
      
      return timezoneMap[timezoneOffset] || 'UTC';
    }
    
    return 'UTC';
  }

  async detectNearbyExpensiveStores(lat: number, lon: number): Promise<ExpensiveStore[]> {
    try {
      const stores: ExpensiveStore[] = [];
      
      for (const keyword of this.EXPENSIVE_STORE_KEYWORDS) {
        const response = await axios.get<GooglePlacesResponse>(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
          {
            params: {
              key: this.GOOGLE_PLACES_API_KEY,
              location: `${lat},${lon}`,
              radius: 5000,
              keyword: keyword,
              type: 'store'
            }
          }
        );

        if (response.data.results) {
          for (const place of response.data.results) {
            const distance = this.calculateDistance(
              lat, lon,
              place.geometry.location.lat,
              place.geometry.location.lng
            );

            stores.push({
              name: place.name,
              category: keyword,
              distance: Math.round(distance),
              priceLevel: this.determinePriceLevel(place.price_level ?? 0, keyword),
              address: place.vicinity
            });
          }
        }
      }

      return stores
        .filter((store, index, self) => 
          index === self.findIndex(s => s.name === store.name)
        )
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);
    } catch (error) {
      logger.error('Error detecting nearby expensive stores:', error);
      return [];
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  correlateMoodWithWeather(mood: number, weather: WeatherData): MoodWeatherCorrelation {
    let correlationScore = 0;
    let moodPrediction = '';
    const recommendations: string[] = [];

    // Temperature correlation
    if (weather.temperature >= 18 && weather.temperature <= 24) {
      correlationScore += 0.2;
    } else if (weather.temperature < 5 || weather.temperature > 30) {
      correlationScore -= 0.15;
      recommendations.push('Extreme temperatures may affect mood negatively');
    }

    // Sunlight/cloudiness correlation
    if (weather.cloudiness < 30) {
      correlationScore += 0.25;
      recommendations.push('Sunny weather detected - great for outdoor activities');
    } else if (weather.cloudiness > 80) {
      correlationScore -= 0.2;
      recommendations.push('Cloudy weather may affect mood - consider indoor activities');
    }

    // UV Index correlation
    if (weather.uvIndex >= 3 && weather.uvIndex <= 6) {
      correlationScore += 0.15;
    } else if (weather.uvIndex > 8) {
      recommendations.push('High UV index - use sun protection');
    }

    // Humidity correlation
    if (weather.humidity >= 40 && weather.humidity <= 60) {
      correlationScore += 0.1;
    } else if (weather.humidity > 80) {
      correlationScore -= 0.1;
      recommendations.push('High humidity may cause discomfort');
    }

    // Pressure correlation
    if (weather.pressure >= 1013 && weather.pressure <= 1020) {
      correlationScore += 0.1;
    } else if (weather.pressure < 1000) {
      correlationScore -= 0.15;
      recommendations.push('Low pressure may cause headaches or mood changes');
    }

    // Wind correlation
    if (weather.windSpeed > 10) {
      correlationScore -= 0.05;
      recommendations.push('Windy conditions detected');
    }

    // Weather type specific correlations
    switch (weather.weatherType.toLowerCase()) {
      case 'clear':
        correlationScore += 0.3;
        recommendations.push('Clear weather - perfect for mood-boosting activities');
        break;
      case 'rain':
        correlationScore -= 0.2;
        recommendations.push('Rainy weather - consider cozy indoor activities');
        break;
      case 'storm':
        correlationScore -= 0.3;
        recommendations.push('Storm conditions - stay indoors and practice relaxation');
        break;
      case 'snow':
        correlationScore += 0.1;
        recommendations.push('Snow weather - enjoy winter activities if you like them');
        break;
    }

    // Mood prediction based on correlation
    const predictedMoodChange = correlationScore * 2;
    const expectedMood = Math.max(1, Math.min(10, mood + predictedMoodChange));
    
    if (expectedMood > mood + 0.5) {
      moodPrediction = 'Weather conditions likely to improve your mood';
    } else if (expectedMood < mood - 0.5) {
      moodPrediction = 'Weather conditions may negatively affect your mood';
    } else {
      moodPrediction = 'Weather conditions are neutral for your mood';
    }

    // Add general recommendations
    if (correlationScore < -0.3) {
      recommendations.push('Consider vitamin D supplements', 'Try light therapy', 'Engage in physical exercise indoors');
    } else if (correlationScore > 0.3) {
      recommendations.push('Great day for outdoor activities', 'Take advantage of the good weather for exercise');
    }

    return {
      mood,
      weather,
      correlationScore: Math.round(correlationScore * 100) / 100,
      moodPrediction,
      recommendations
    };
  }

  async adjustSleepTrackingForTimezone(
    userId: string,
    currentLat: number,
    currentLon: number,
    sleepData: Partial<SleepTrackingData>
  ): Promise<SleepTrackingData> {
    try {
      const timezone = await this.getTimezoneData(currentLat, currentLon);
      const now = new Date();
      
      // Adjust sleep times based on timezone
      const adjustedBedtime = sleepData.bedtime ? 
        this.adjustTimeForTimezone(sleepData.bedtime, timezone) : 
        new Date(now.getTime() - (8 * 60 * 60 * 1000)); // Default 8 hours ago
      
      const adjustedWakeTime = sleepData.wakeTime ? 
        this.adjustTimeForTimezone(sleepData.wakeTime, timezone) : 
        now;

      const sleepDuration = (adjustedWakeTime.getTime() - adjustedBedtime.getTime()) / (1000 * 60 * 60);

      return {
        userId,
        timezone,
        bedtime: adjustedBedtime,
        wakeTime: adjustedWakeTime,
        sleepDuration: Math.round(sleepDuration * 100) / 100,
        sleepQuality: sleepData.sleepQuality || 5,
        locationAdjusted: true
      };
    } catch (error) {
      logger.error('Error adjusting sleep tracking for timezone:', error);
      throw new Error('Failed to adjust sleep tracking');
    }
  }

  async getComprehensiveLocationMoodData(
    userId: string,
    lat: number,
    lon: number,
    currentMood: number
  ): Promise<{
    weather: WeatherData;
    moodCorrelation: MoodWeatherCorrelation;
    nearbyStores: ExpensiveStore[];
    sleepAdjustment: SleepTrackingData;
    recommendations: string[];
  }> {
    try {
      // Get all data in parallel
      const [weather, nearbyStores] = await Promise.all([
        this.getWeatherData(lat, lon),
        this.detectNearbyExpensiveStores(lat, lon)
      ]);

      const moodCorrelation = this.correlateMoodWithWeather(currentMood, weather);
      const sleepAdjustment = await this.adjustSleepTrackingForTimezone(userId, lat, lon, {});

      // Generate comprehensive recommendations
      const recommendations = [
        ...moodCorrelation.recommendations,
        ...this.generateStoreRecommendations(nearbyStores),
        ...this.generateSleepRecommendations(sleepAdjustment, weather)
      ];

      return {
        weather,
        moodCorrelation,
        nearbyStores,
        sleepAdjustment,
        recommendations: [...new Set(recommendations)]
      };
    } catch (error) {
      logger.error('Error getting comprehensive location mood data:', error);
      throw new Error('Failed to get comprehensive data');
    }
  }

  private generateStoreRecommendations(stores: ExpensiveStore[]): string[] {
    const recommendations: string[] = [];
    
    if (stores.length > 0) {
      const nearbyCount = stores.filter(s => s.distance < 500).length;
      if (nearbyCount > 3) {
        recommendations.push('You\'re in an area with many expensive stores - be mindful of impulse purchases');
      }
      
      const luxuryCount = stores.filter(s => s.priceLevel === 'luxury').length;
      if (luxuryCount > 1) {
        recommendations.push('Multiple luxury stores nearby - consider your budget before shopping');
      }
    }

    return recommendations;
  }

  private generateSleepRecommendations(sleep: SleepTrackingData, weather: WeatherData): string[] {
    const recommendations: string[] = [];
    
    if (sleep.sleepDuration < 6) {
      recommendations.push('You may need more sleep for better mood regulation');
    } else if (sleep.sleepDuration > 9) {
      recommendations.push('Consider if you\'re oversleeping - it might affect your mood');
    }

    if (weather.temperature > 25) {
      recommendations.push('Warm weather - ensure your sleeping environment is cool');
    } else if (weather.temperature < 10) {
      recommendations.push('Cold weather - maintain comfortable sleeping temperature');
    }

    return recommendations;
  }

  private adjustTimeForTimezone(time: Date, timezone: string): Date {
    // Simple timezone adjustment - in production, use a proper timezone library
    const offset = this.getTimezoneOffset(timezone);
    return new Date(time.getTime() + (offset * 60 * 60 * 1000));
  }

  private getTimezoneOffset(timezone: string): number {
    // Simplified timezone offsets - use a proper library like moment-timezone in production
    const offsets: { [key: string]: number } = {
      'UTC': 0,
      'America/New_York': -5,
      'America/Los_Angeles': -8,
      'Europe/London': 0,
      'Europe/Paris': 1,
      'Asia/Tokyo': 9,
      'Asia/Shanghai': 8
    };
    
    return offsets[timezone] || 0;
  }

  private determinePriceLevel(priceLevel: number, keyword: string): 'expensive' | 'very_expensive' | 'luxury' {
    if (keyword.toLowerCase().includes('luxury') || 
        ['gucci', 'louis vuitton', 'prada', 'chanel', 'hermès'].includes(keyword.toLowerCase())) {
      return 'luxury';
    } else if (priceLevel >= 4) {
      return 'very_expensive';
    } else {
      return 'expensive';
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default WeatherMoodService;