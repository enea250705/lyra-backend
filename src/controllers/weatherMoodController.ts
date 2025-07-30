import { Request, Response } from 'express';
import WeatherMoodService from '../services/weatherMoodService';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

class WeatherMoodController {
  private weatherMoodService: WeatherMoodService;

  constructor() {
    this.weatherMoodService = new WeatherMoodService();
  }

  /**
   * Get weather data for a specific location
   * @route GET /api/v1/weather-mood/weather
   */
  getWeatherData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        sendError(res, 'Latitude and longitude are required', 400);
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        sendError(res, 'Invalid latitude or longitude values', 400);
        return;
      }

      const weatherData = await this.weatherMoodService.getWeatherData(latitude, longitude);
      sendSuccess(res, weatherData, 'Weather data retrieved successfully');
    } catch (error) {
      logger.error('Error getting weather data:', error);
      sendError(res, 'Failed to retrieve weather data', 500);
    }
  };

  /**
   * Correlate mood with weather conditions
   * @route POST /api/v1/weather-mood/correlate
   */
  correlateMoodWithWeather = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mood, lat, lon } = req.body;

      if (!mood || !lat || !lon) {
        sendError(res, 'Mood, latitude, and longitude are required', 400);
        return;
      }

      if (mood < 1 || mood > 10) {
        sendError(res, 'Mood must be between 1 and 10', 400);
        return;
      }

      const weatherData = await this.weatherMoodService.getWeatherData(lat, lon);
      const correlation = this.weatherMoodService.correlateMoodWithWeather(mood, weatherData);

      sendSuccess(res, correlation, 'Mood-weather correlation calculated successfully');
    } catch (error) {
      logger.error('Error correlating mood with weather:', error);
      sendError(res, 'Failed to correlate mood with weather', 500);
    }
  };

  /**
   * Detect nearby expensive stores
   * @route GET /api/v1/weather-mood/nearby-stores
   */
  getNearbyExpensiveStores = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        sendError(res, 'Latitude and longitude are required', 400);
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        sendError(res, 'Invalid latitude or longitude values', 400);
        return;
      }

      const stores = await this.weatherMoodService.detectNearbyExpensiveStores(latitude, longitude);
      sendSuccess(res, stores, 'Nearby expensive stores retrieved successfully');
    } catch (error) {
      logger.error('Error getting nearby expensive stores:', error);
      sendError(res, 'Failed to retrieve nearby stores', 500);
    }
  };

  /**
   * Adjust sleep tracking for current timezone
   * @route POST /api/v1/weather-mood/adjust-sleep
   */
  adjustSleepTracking = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, lat, lon, sleepData } = req.body;

      if (!userId || !lat || !lon) {
        sendError(res, 'User ID, latitude, and longitude are required', 400);
        return;
      }

      const adjustedSleepData = await this.weatherMoodService.adjustSleepTrackingForTimezone(
        userId,
        lat,
        lon,
        sleepData || {}
      );

      sendSuccess(res, adjustedSleepData, 'Sleep tracking adjusted for timezone successfully');
    } catch (error) {
      logger.error('Error adjusting sleep tracking:', error);
      sendError(res, 'Failed to adjust sleep tracking', 500);
    }
  };

  /**
   * Get comprehensive location-based mood data
   * @route POST /api/v1/weather-mood/comprehensive
   */
  getComprehensiveData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, lat, lon, currentMood } = req.body;

      if (!userId || !lat || !lon || !currentMood) {
        sendError(res, 'User ID, latitude, longitude, and current mood are required', 400);
        return;
      }

      if (currentMood < 1 || currentMood > 10) {
        sendError(res, 'Current mood must be between 1 and 10', 400);
        return;
      }

      const comprehensiveData = await this.weatherMoodService.getComprehensiveLocationMoodData(
        userId,
        lat,
        lon,
        currentMood
      );

      sendSuccess(res, comprehensiveData, 'Comprehensive location mood data retrieved successfully');
    } catch (error) {
      logger.error('Error getting comprehensive data:', error);
      sendError(res, 'Failed to retrieve comprehensive data', 500);
    }
  };

  /**
   * Get timezone information for a location
   * @route GET /api/v1/weather-mood/timezone
   */
  getTimezoneInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        sendError(res, 'Latitude and longitude are required', 400);
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        sendError(res, 'Invalid latitude or longitude values', 400);
        return;
      }

      const timezone = await this.weatherMoodService.getTimezoneData(latitude, longitude);
      sendSuccess(res, { timezone }, 'Timezone information retrieved successfully');
    } catch (error) {
      logger.error('Error getting timezone info:', error);
      sendError(res, 'Failed to retrieve timezone information', 500);
    }
  };
}

export default WeatherMoodController;