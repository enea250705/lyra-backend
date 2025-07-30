import { Model, DataTypes, Association, Op } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface SleepStages {
  light: number;
  deep: number;
  rem: number;
  awake: number;
}

class GoogleFitSleep extends Model {
  public id!: string;
  public userId!: string;
  public date!: string;
  public bedtime!: Date;
  public wakeTime!: Date;
  public durationHours!: number;
  public sleepStages!: SleepStages;
  public createdAt!: Date;

  // Associations
  public static associations: {
    user: Association<GoogleFitSleep, User>;
  };

  // Instance methods
  public getSleepEfficiency(): number {
    if (!this.sleepStages) return 0;
    const totalSleep = this.sleepStages.light + this.sleepStages.deep + this.sleepStages.rem;
    const totalTime = totalSleep + this.sleepStages.awake;
    return Math.round((totalSleep / totalTime) * 100);
  }

  public getDeepSleepPercentage(): number {
    if (!this.sleepStages) return 0;
    const totalSleep = this.sleepStages.light + this.sleepStages.deep + this.sleepStages.rem;
    return Math.round((this.sleepStages.deep / totalSleep) * 100);
  }

  public getREMPercentage(): number {
    if (!this.sleepStages) return 0;
    const totalSleep = this.sleepStages.light + this.sleepStages.deep + this.sleepStages.rem;
    return Math.round((this.sleepStages.rem / totalSleep) * 100);
  }

  public getSleepQualityScore(): number {
    const efficiency = this.getSleepEfficiency();
    const deepSleepPercent = this.getDeepSleepPercentage();
    const remPercent = this.getREMPercentage();
    
    // Ideal ranges: efficiency 85%+, deep sleep 20-25%, REM 20-25%
    let score = 0;
    
    // Efficiency score (40% weight)
    if (efficiency >= 85) score += 40;
    else if (efficiency >= 75) score += 30;
    else if (efficiency >= 65) score += 20;
    else score += 10;
    
    // Deep sleep score (30% weight)
    if (deepSleepPercent >= 20 && deepSleepPercent <= 25) score += 30;
    else if (deepSleepPercent >= 15 && deepSleepPercent <= 30) score += 20;
    else score += 10;
    
    // REM sleep score (30% weight)
    if (remPercent >= 20 && remPercent <= 25) score += 30;
    else if (remPercent >= 15 && remPercent <= 30) score += 20;
    else score += 10;

    return Math.min(score, 100);
  }

  // Static methods for analytics
  public static async getWeeklyAverage(userId: string, startDate: Date): Promise<{
    avgDuration: number;
    avgEfficiency: number;
    avgDeepSleep: number;
    avgREM: number;
    avgQualityScore: number;
  }> {
    const weekAgo = new Date(startDate);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sleepData = await GoogleFitSleep.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [
            weekAgo.toISOString().split('T')[0],
            startDate.toISOString().split('T')[0]
          ]
        }
      }
    });

    if (sleepData.length === 0) {
      return {
        avgDuration: 0,
        avgEfficiency: 0,
        avgDeepSleep: 0,
        avgREM: 0,
        avgQualityScore: 0
      };
    }

    const avgDuration = sleepData.reduce((sum, s) => sum + s.durationHours, 0) / sleepData.length;
    const avgEfficiency = sleepData.reduce((sum, s) => sum + s.getSleepEfficiency(), 0) / sleepData.length;
    const avgDeepSleep = sleepData.reduce((sum, s) => sum + s.getDeepSleepPercentage(), 0) / sleepData.length;
    const avgREM = sleepData.reduce((sum, s) => sum + s.getREMPercentage(), 0) / sleepData.length;
    const avgQualityScore = sleepData.reduce((sum, s) => sum + s.getSleepQualityScore(), 0) / sleepData.length;

    return {
      avgDuration: Math.round(avgDuration * 100) / 100,
      avgEfficiency: Math.round(avgEfficiency),
      avgDeepSleep: Math.round(avgDeepSleep),
      avgREM: Math.round(avgREM),
      avgQualityScore: Math.round(avgQualityScore)
    };
  }

  public static async getSleepTrends(userId: string, days: number = 30): Promise<{
    durationTrend: 'improving' | 'stable' | 'declining';
    qualityTrend: 'improving' | 'stable' | 'declining';
    consistencyScore: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sleepData = await GoogleFitSleep.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ]
        }
      },
      order: [['date', 'ASC']]
    });

    if (sleepData.length < 7) {
      return {
        durationTrend: 'stable',
        qualityTrend: 'stable',
        consistencyScore: 0
      };
    }

    // Calculate trends (first half vs second half)
    const midpoint = Math.floor(sleepData.length / 2);
    const firstHalf = sleepData.slice(0, midpoint);
    const secondHalf = sleepData.slice(midpoint);

    const firstHalfAvgDuration = firstHalf.reduce((sum, s) => sum + s.durationHours, 0) / firstHalf.length;
    const secondHalfAvgDuration = secondHalf.reduce((sum, s) => sum + s.durationHours, 0) / secondHalf.length;

    const firstHalfAvgQuality = firstHalf.reduce((sum, s) => sum + s.getSleepQualityScore(), 0) / firstHalf.length;
    const secondHalfAvgQuality = secondHalf.reduce((sum, s) => sum + s.getSleepQualityScore(), 0) / secondHalf.length;

    const durationDiff = secondHalfAvgDuration - firstHalfAvgDuration;
    const qualityDiff = secondHalfAvgQuality - firstHalfAvgQuality;

    const durationTrend = durationDiff > 0.2 ? 'improving' : durationDiff < -0.2 ? 'declining' : 'stable';
    const qualityTrend = qualityDiff > 5 ? 'improving' : qualityDiff < -5 ? 'declining' : 'stable';

    // Calculate consistency (lower variance = higher consistency)
    const durations = sleepData.map(s => s.durationHours);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    const consistencyScore = Math.max(0, Math.round(100 - (variance * 20))); // Lower variance = higher score

    return {
      durationTrend,
      qualityTrend,
      consistencyScore
    };
  }
}

GoogleFitSleep.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    bedtime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    wakeTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    durationHours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 24,
      },
    },
    sleepStages: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GoogleFitSleep',
    tableName: 'google_fit_sleep',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date']
      }
    ]
  }
);

// Define associations
GoogleFitSleep.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GoogleFitSleep, { foreignKey: 'userId', as: 'googleFitSleep' });

export default GoogleFitSleep; 