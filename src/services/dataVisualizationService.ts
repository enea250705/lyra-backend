import { Op } from 'sequelize';
import MoodEntry from '../models/MoodEntry';
import SleepLog from '../models/SleepLog';
import JournalEntry from '../models/JournalEntry';
import EnergyEntry from '../models/EnergyEntry';
import logger from '../utils/logger';

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

export interface TrendData {
  period: string;
  value: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ProgressData {
  category: string;
  current: number;
  target: number;
  progress: number;
  unit: string;
  trend: TrendData;
}

export class DataVisualizationService {
  /**
   * Generate mood trend chart data
   */
  static async getMoodTrendChart(userId: string, days: number = 30): Promise<ChartData> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const moodEntries = await MoodEntry.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: startDate },
        },
        order: [['createdAt', 'ASC']],
      });

      const labels: string[] = [];
      const moodValues: number[] = [];

      // Group by date
      const dailyData = new Map<string, number[]>();
      
      moodEntries.forEach(entry => {
        const date = entry.createdAt.toISOString().split('T')[0];
        if (!dailyData.has(date)) {
          dailyData.set(date, []);
        }
        dailyData.get(date)!.push(entry.moodValue);
      });

      // Calculate averages and create labels
      dailyData.forEach((data, date) => {
        labels.push(new Date(date).toLocaleDateString());
        moodValues.push(data.reduce((a, b) => a + b, 0) / data.length);
      });

      return {
        labels,
        datasets: [
          {
            label: 'Mood',
            data: moodValues,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      };
    } catch (error) {
      logger.error('Error generating mood trend chart:', error);
      throw error;
    }
  }

  /**
   * Generate sleep quality chart data
   */
  static async getSleepQualityChart(userId: string, days: number = 30): Promise<ChartData> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const sleepLogs = await SleepLog.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: startDate },
        },
        order: [['createdAt', 'ASC']],
      });

      const labels: string[] = [];
      const durationData: number[] = [];
      const qualityData: number[] = [];

      sleepLogs.forEach(log => {
        labels.push(log.createdAt.toLocaleDateString());
        durationData.push(log.getDuration());
        qualityData.push(log.qualityRating);
      });

      return {
        labels,
        datasets: [
          {
            label: 'Sleep Duration (hours)',
            data: durationData,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Sleep Quality (1-10)',
            data: qualityData,
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      };
    } catch (error) {
      logger.error('Error generating sleep quality chart:', error);
      throw error;
    }
  }

  /**
   * Generate mood distribution pie chart
   */
  static async getMoodDistributionChart(userId: string, days: number = 30): Promise<ChartData> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const moodEntries = await MoodEntry.findAll({
        where: {
          userId,
          createdAt: { [Op.gte]: startDate },
        },
      });

      const moodCounts = new Map<string, number>();
      moodEntries.forEach(entry => {
        const category = entry.moodCategory;
        moodCounts.set(category, (moodCounts.get(category) || 0) + 1);
      });

      const labels = Array.from(moodCounts.keys());
      const data = Array.from(moodCounts.values());
      const colors = [
        'rgba(239, 68, 68, 0.8)',   // Red for negative moods
        'rgba(245, 158, 11, 0.8)',  // Yellow for neutral moods
        'rgba(16, 185, 129, 0.8)',  // Green for positive moods
        'rgba(59, 130, 246, 0.8)',   // Blue for other moods
        'rgba(139, 92, 246, 0.8)',   // Purple for other moods
      ];

      return {
        labels,
        datasets: [{
          label: 'Sleep Quality',
          data,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length).map(color => color.replace('0.8', '1')),
          borderWidth: 2,
        }],
      };
    } catch (error) {
      logger.error('Error generating mood distribution chart:', error);
      throw error;
    }
  }

  /**
   * Generate trend analysis data
   */
  static async getTrendAnalysis(userId: string, metric: string, days: number = 30): Promise<TrendData[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const previousStartDate = new Date();
      previousStartDate.setDate(previousStartDate.getDate() - (days * 2));

      let currentData: number[] = [];
      let previousData: number[] = [];

      switch (metric) {
        case 'mood':
          const currentMoods = await MoodEntry.findAll({
            where: { userId, createdAt: { [Op.gte]: startDate } },
          });
          const previousMoods = await MoodEntry.findAll({
            where: { 
              userId, 
              createdAt: { [Op.between]: [previousStartDate, startDate] },
            },
          });
          currentData = currentMoods.map(entry => entry.moodValue);
          previousData = previousMoods.map(entry => entry.moodValue);
          break;

        case 'sleep':
          const currentSleeps = await SleepLog.findAll({
            where: { userId, createdAt: { [Op.gte]: startDate } },
          });
          const previousSleeps = await SleepLog.findAll({
            where: { 
              userId, 
              createdAt: { [Op.between]: [previousStartDate, startDate] },
            },
          });
          currentData = currentSleeps.map(log => log.qualityRating);
          previousData = previousSleeps.map(log => log.qualityRating);
          break;
      }

      const currentAvg = currentData.length > 0 ? 
        currentData.reduce((sum, val) => sum + val, 0) / currentData.length : 0;
      const previousAvg = previousData.length > 0 ? 
        previousData.reduce((sum, val) => sum + val, 0) / previousData.length : 0;

      const change = currentAvg - previousAvg;
      const changePercentage = previousAvg > 0 ? (change / previousAvg) * 100 : 0;
      const trend = change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable';

      return [{
        period: `${days} days`,
        value: Math.round(currentAvg * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercentage: Math.round(changePercentage * 100) / 100,
        trend,
      }];
    } catch (error) {
      logger.error('Error generating trend analysis:', error);
      throw error;
    }
  }

  /**
   * Generate progress tracking data
   */
  static async getProgressTracking(userId: string): Promise<ProgressData[]> {
    try {
      const progressData: ProgressData[] = [];

      // Mood progress
      const moodEntries = await MoodEntry.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 30,
      });
      const avgMood = moodEntries.length > 0 ? 
        moodEntries.reduce((sum, entry) => sum + entry.moodValue, 0) / moodEntries.length : 0;
      
      const moodTrend = await this.getTrendAnalysis(userId, 'mood', 7);
      
      progressData.push({
        category: 'Mood',
        current: Math.round(avgMood * 100) / 100,
        target: 7,
        progress: Math.round((avgMood / 10) * 100),
        unit: '/10',
        trend: moodTrend[0],
      });

      // Sleep progress
      const sleepLogs = await SleepLog.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 30,
      });
      const avgSleepQuality = sleepLogs.length > 0 ? 
        sleepLogs.reduce((sum, log) => sum + log.qualityRating, 0) / sleepLogs.length : 0;
      
      const sleepTrend = await this.getTrendAnalysis(userId, 'sleep', 7);
      
      progressData.push({
        category: 'Sleep Quality',
        current: Math.round(avgSleepQuality * 100) / 100,
        target: 8,
        progress: Math.round((avgSleepQuality / 10) * 100),
        unit: '/10',
        trend: sleepTrend[0],
      });

      return progressData;
    } catch (error) {
      logger.error('Error generating progress tracking:', error);
      throw error;
    }
  }

  /**
   * Generate chart data for analytics
   */
  static async generateChartData(userId: string, chartType: string, period: string = 'week', filters?: any): Promise<any> {
    try {
      switch (chartType) {
        case 'mood-trend':
          return await this.getMoodTrendChart(userId, period === 'week' ? 7 : period === 'month' ? 30 : 1);
        case 'sleep-quality':
          return await this.getSleepQualityChart(userId, period === 'week' ? 7 : period === 'month' ? 30 : 1);
        case 'mood-distribution':
          return await this.getMoodDistributionChart(userId, period === 'week' ? 7 : period === 'month' ? 30 : 1);
        default:
          throw new Error(`Unsupported chart type: ${chartType}`);
      }
    } catch (error) {
      logger.error('Error generating chart data:', error);
      throw error;
    }
  }

  /**
   * Generate analytics dashboard data
   */
  static async generateDashboard(userId: string, period: string = 'week'): Promise<any> {
    try {
      const days = period === 'week' ? 7 : period === 'month' ? 30 : 1;
      
      const [moodChart, sleepChart, moodDistChart, progressData] = await Promise.all([
        this.getMoodTrendChart(userId, days),
        this.getSleepQualityChart(userId, days),
        this.getMoodDistributionChart(userId, days),
        this.getProgressTracking(userId),
      ]);

      const [moodTrend, sleepTrend, energyTrend] = await Promise.all([
        this.getTrendAnalysis(userId, 'mood', days),
        this.getTrendAnalysis(userId, 'sleep', days),
        this.getTrendAnalysis(userId, 'energy', days),
      ]);

      return {
        charts: { moodChart, sleepChart, moodDistChart },
        trends: { moodTrend, sleepTrend, energyTrend },
        progress: progressData,
        period,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error('Error generating dashboard:', error);
      throw error;
    }
  }
}

export default DataVisualizationService;