import { google } from 'googleapis';
import axios from 'axios';
import logger from '../utils/logger';

export interface GoogleFitStepsData {
  date: string;
  steps: number;
  distance?: number;
  calories?: number;
  activeMinutes?: number;
}

export interface GoogleFitHeartRateData {
  timestamp: string;
  bpm: number;
  accuracy?: number;
}

export interface GoogleFitActivityData {
  activityType: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  calories?: number;
  distance?: number;
  steps?: number;
}

export interface GoogleFitSleepData {
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number; // in hours
  sleepStages?: {
    light: number;
    deep: number;
    rem: number;
    awake: number;
  };
}

export interface GoogleFitWeightData {
  timestamp: string;
  weight: number; // in kg
  bodyFat?: number; // percentage
}

class GoogleFitService {
  private fitness: any;

  constructor() {
    // Initialize Google Fitness API
    this.fitness = google.fitness({ version: 'v1' });
  }

  /**
   * Initialize OAuth2 client with user credentials
   */
  private getOAuth2Client(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    return oauth2Client;
  }

  /**
   * Get user's daily steps data
   */
  async getStepsData(accessToken: string, startDate: string, endDate: string): Promise<GoogleFitStepsData[]> {
    try {
      const auth = this.getOAuth2Client(accessToken);
      
      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      const response = await this.fitness.users.dataset.aggregate({
        auth,
        userId: 'me',
        requestBody: {
          aggregateBy: [
            { dataTypeName: 'com.google.step_count.delta' },
            { dataTypeName: 'com.google.distance.delta' },
            { dataTypeName: 'com.google.calories.expended' },
            { dataTypeName: 'com.google.active_minutes' }
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        }
      });

      const stepsData: GoogleFitStepsData[] = [];

      if (response.data.bucket) {
        for (const bucket of response.data.bucket) {
          const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
          
          let steps = 0, distance = 0, calories = 0, activeMinutes = 0;

          for (const dataset of bucket.dataset) {
            if (dataset.dataSourceId?.includes('step_count')) {
              steps = dataset.point?.[0]?.value?.[0]?.intVal || 0;
            } else if (dataset.dataSourceId?.includes('distance')) {
              distance = dataset.point?.[0]?.value?.[0]?.fpVal || 0;
            } else if (dataset.dataSourceId?.includes('calories')) {
              calories = dataset.point?.[0]?.value?.[0]?.fpVal || 0;
            } else if (dataset.dataSourceId?.includes('active_minutes')) {
              activeMinutes = dataset.point?.[0]?.value?.[0]?.intVal || 0;
            }
          }

          stepsData.push({
            date,
            steps,
            distance: Math.round(distance * 100) / 100,
            calories: Math.round(calories),
            activeMinutes
          });
        }
      }

      logger.info(`Fetched steps data for ${stepsData.length} days`);
      return stepsData;

    } catch (error) {
      logger.error('Error fetching Google Fit steps data:', error);
      throw new Error('Failed to fetch steps data from Google Fit');
    }
  }

  /**
   * Get user's heart rate data
   */
  async getHeartRateData(accessToken: string, startDate: string, endDate: string): Promise<GoogleFitHeartRateData[]> {
    try {
      const auth = this.getOAuth2Client(accessToken);
      
      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      const response = await this.fitness.users.dataset.aggregate({
        auth,
        userId: 'me',
        requestBody: {
          aggregateBy: [
            { dataTypeName: 'com.google.heart_rate.bpm' }
          ],
          bucketByTime: { durationMillis: 3600000 }, // 1 hour buckets
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        }
      });

      const heartRateData: GoogleFitHeartRateData[] = [];

      if (response.data.bucket) {
        for (const bucket of response.data.bucket) {
          for (const dataset of bucket.dataset) {
            if (dataset.point) {
              for (const point of dataset.point) {
                heartRateData.push({
                  timestamp: new Date(parseInt(point.startTimeNanos) / 1000000).toISOString(),
                  bpm: point.value[0].fpVal,
                  accuracy: point.value[1]?.intVal
                });
              }
            }
          }
        }
      }

      logger.info(`Fetched heart rate data: ${heartRateData.length} entries`);
      return heartRateData;

    } catch (error) {
      logger.error('Error fetching Google Fit heart rate data:', error);
      throw new Error('Failed to fetch heart rate data from Google Fit');
    }
  }

  /**
   * Get user's activity/exercise data
   */
  async getActivityData(accessToken: string, startDate: string, endDate: string): Promise<GoogleFitActivityData[]> {
    try {
      const auth = this.getOAuth2Client(accessToken);
      
      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      const response = await this.fitness.users.sessions.list({
        auth,
        userId: 'me',
        startTime: new Date(startDate).toISOString(),
        endTime: new Date(endDate).toISOString()
      });

      const activityData: GoogleFitActivityData[] = [];

      if (response.data.session) {
        for (const session of response.data.session) {
          const startTime = new Date(parseInt(session.startTimeMillis!)).toISOString();
          const endTime = new Date(parseInt(session.endTimeMillis!)).toISOString();
          const duration = (parseInt(session.endTimeMillis!) - parseInt(session.startTimeMillis!)) / (1000 * 60);

          activityData.push({
            activityType: session.activityType?.toString() || 'Unknown',
            startTime,
            endTime,
            duration: Math.round(duration),
            calories: 0, // Would need additional API call to get detailed metrics
            distance: 0,
            steps: 0
          });
        }
      }

      logger.info(`Fetched activity data: ${activityData.length} activities`);
      return activityData;

    } catch (error) {
      logger.error('Error fetching Google Fit activity data:', error);
      throw new Error('Failed to fetch activity data from Google Fit');
    }
  }

  /**
   * Get user's sleep data
   */
  async getSleepData(accessToken: string, startDate: string, endDate: string): Promise<GoogleFitSleepData[]> {
    try {
      const auth = this.getOAuth2Client(accessToken);
      
      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      const response = await this.fitness.users.dataset.aggregate({
        auth,
        userId: 'me',
        requestBody: {
          aggregateBy: [
            { dataTypeName: 'com.google.sleep.segment' }
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        }
      });

      const sleepData: GoogleFitSleepData[] = [];

      if (response.data.bucket) {
        for (const bucket of response.data.bucket) {
          const date = new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0];
          
          // Process sleep segments to calculate total sleep
          let bedtime = '';
          let wakeTime = '';
          let totalSleep = 0;

          for (const dataset of bucket.dataset) {
            if (dataset.point) {
              for (const point of dataset.point) {
                const startTime = new Date(parseInt(point.startTimeNanos) / 1000000);
                const endTime = new Date(parseInt(point.endTimeNanos) / 1000000);
                
                if (!bedtime || startTime < new Date(bedtime)) {
                  bedtime = startTime.toISOString();
                }
                if (!wakeTime || endTime > new Date(wakeTime)) {
                  wakeTime = endTime.toISOString();
                }

                totalSleep += (parseInt(point.endTimeNanos) - parseInt(point.startTimeNanos)) / (1000000 * 1000 * 60 * 60);
              }
            }
          }

          if (bedtime && wakeTime && totalSleep > 0) {
            sleepData.push({
              date,
              bedtime,
              wakeTime,
              duration: Math.round(totalSleep * 100) / 100
            });
          }
        }
      }

      logger.info(`Fetched sleep data for ${sleepData.length} days`);
      return sleepData;

    } catch (error) {
      logger.error('Error fetching Google Fit sleep data:', error);
      throw new Error('Failed to fetch sleep data from Google Fit');
    }
  }

  /**
   * Get user's weight data
   */
  async getWeightData(accessToken: string, startDate: string, endDate: string): Promise<GoogleFitWeightData[]> {
    try {
      const auth = this.getOAuth2Client(accessToken);
      
      const startTimeMillis = new Date(startDate).getTime();
      const endTimeMillis = new Date(endDate).getTime();

      const response = await this.fitness.users.dataset.aggregate({
        auth,
        userId: 'me',
        requestBody: {
          aggregateBy: [
            { dataTypeName: 'com.google.weight' },
            { dataTypeName: 'com.google.body.fat.percentage' }
          ],
          bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        }
      });

      const weightData: GoogleFitWeightData[] = [];

      if (response.data.bucket) {
        for (const bucket of response.data.bucket) {
          let weight = 0;
          let bodyFat = 0;

          for (const dataset of bucket.dataset) {
            if (dataset.dataSourceId?.includes('weight') && dataset.point?.[0]) {
              weight = dataset.point[0].value[0].fpVal;
            } else if (dataset.dataSourceId?.includes('body.fat') && dataset.point?.[0]) {
              bodyFat = dataset.point[0].value[0].fpVal;
            }
          }

          if (weight > 0) {
            weightData.push({
              timestamp: new Date(parseInt(bucket.startTimeMillis)).toISOString(),
              weight: Math.round(weight * 100) / 100,
              bodyFat: bodyFat > 0 ? Math.round(bodyFat * 100) / 100 : undefined
            });
          }
        }
      }

      logger.info(`Fetched weight data: ${weightData.length} entries`);
      return weightData;

    } catch (error) {
      logger.error('Error fetching Google Fit weight data:', error);
      throw new Error('Failed to fetch weight data from Google Fit');
    }
  }

  /**
   * Get comprehensive fitness data for a user
   */
  async getComprehensiveFitnessData(accessToken: string, startDate: string, endDate: string) {
    try {
      const [steps, heartRate, activities, sleep, weight] = await Promise.all([
        this.getStepsData(accessToken, startDate, endDate),
        this.getHeartRateData(accessToken, startDate, endDate),
        this.getActivityData(accessToken, startDate, endDate),
        this.getSleepData(accessToken, startDate, endDate),
        this.getWeightData(accessToken, startDate, endDate)
      ]);

      return {
        steps,
        heartRate,
        activities,
        sleep,
        weight,
        summary: {
          totalSteps: steps.reduce((sum, day) => sum + day.steps, 0),
          avgHeartRate: heartRate.length > 0 ? 
            Math.round(heartRate.reduce((sum, hr) => sum + hr.bpm, 0) / heartRate.length) : 0,
          totalActivities: activities.length,
          avgSleepHours: sleep.length > 0 ? 
            Math.round((sleep.reduce((sum, s) => sum + s.duration, 0) / sleep.length) * 100) / 100 : 0
        }
      };

    } catch (error) {
      logger.error('Error fetching comprehensive fitness data:', error);
      throw new Error('Failed to fetch comprehensive fitness data');
    }
  }

  /**
   * Verify Google Fit access token and get user info
   */
  async verifyAccessToken(accessToken: string): Promise<boolean> {
    try {
      const auth = this.getOAuth2Client(accessToken);
      
      // Try to make a simple API call to verify token
      const response = await this.fitness.users.dataSources.list({
        auth,
        userId: 'me'
      });

      return response.status === 200;

    } catch (error) {
      logger.error('Error verifying Google Fit access token:', error);
      return false;
    }
  }
}

export default new GoogleFitService(); 