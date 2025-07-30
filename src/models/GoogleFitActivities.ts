import { Model, DataTypes, Association, Op } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class GoogleFitActivities extends Model {
  public id!: string;
  public userId!: string;
  public activityType!: string;
  public startTime!: Date;
  public endTime!: Date;
  public durationMinutes!: number;
  public calories!: number;
  public distance!: number;
  public steps!: number;
  public createdAt!: Date;

  // Associations
  public static associations: {
    user: Association<GoogleFitActivities, User>;
  };

  // Instance methods
  public getDistanceInKm(): number {
    return Math.round((this.distance / 1000) * 100) / 100;
  }

  public getIntensity(): string {
    const caloriesPerMinute = this.calories / this.durationMinutes;
    if (caloriesPerMinute < 5) return 'Light';
    if (caloriesPerMinute < 10) return 'Moderate';
    if (caloriesPerMinute < 15) return 'Vigorous';
    return 'High';
  }

  public getActivityCategory(): string {
    const type = this.activityType.toLowerCase();
    if (type.includes('running') || type.includes('jogging')) return 'Running';
    if (type.includes('walking')) return 'Walking';
    if (type.includes('cycling') || type.includes('biking')) return 'Cycling';
    if (type.includes('swimming')) return 'Swimming';
    if (type.includes('strength') || type.includes('weight')) return 'Strength';
    if (type.includes('yoga') || type.includes('stretching')) return 'Flexibility';
    return 'Other';
  }

  public getDurationInHours(): number {
    return Math.round((this.durationMinutes / 60) * 100) / 100;
  }

  // Static methods for analytics
  public static async getWeeklyStats(userId: string, startDate: Date): Promise<{
    totalActivities: number;
    totalDuration: number;
    totalCalories: number;
    averageDuration: number;
    mostFrequentActivity: string;
  }> {
    const weekAgo = new Date(startDate);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const activities = await GoogleFitActivities.findAll({
      where: {
        userId,
        startTime: {
          [Op.between]: [weekAgo, startDate]
        }
      }
    });

    if (activities.length === 0) {
      return {
        totalActivities: 0,
        totalDuration: 0,
        totalCalories: 0,
        averageDuration: 0,
        mostFrequentActivity: 'None'
      };
    }

    const totalDuration = activities.reduce((sum, a) => sum + a.durationMinutes, 0);
    const totalCalories = activities.reduce((sum, a) => sum + a.calories, 0);
    const averageDuration = Math.round(totalDuration / activities.length);

    // Find most frequent activity
    const activityCounts: { [key: string]: number } = {};
    activities.forEach(a => {
      const category = a.getActivityCategory();
      activityCounts[category] = (activityCounts[category] || 0) + 1;
    });

    const mostFrequentActivity = Object.keys(activityCounts).reduce((a, b) => 
      activityCounts[a] > activityCounts[b] ? a : b
    );

    return {
      totalActivities: activities.length,
      totalDuration,
      totalCalories,
      averageDuration,
      mostFrequentActivity
    };
  }

  public static async getActivityBreakdown(userId: string, startDate: Date, endDate: Date): Promise<{
    [category: string]: {
      count: number;
      totalDuration: number;
      totalCalories: number;
    }
  }> {
    const activities = await GoogleFitActivities.findAll({
      where: {
        userId,
        startTime: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    const breakdown: { [category: string]: { count: number; totalDuration: number; totalCalories: number } } = {};

    activities.forEach(activity => {
      const category = activity.getActivityCategory();
      if (!breakdown[category]) {
        breakdown[category] = { count: 0, totalDuration: 0, totalCalories: 0 };
      }
      breakdown[category].count++;
      breakdown[category].totalDuration += activity.durationMinutes;
      breakdown[category].totalCalories += activity.calories;
    });

    return breakdown;
  }

  public static async getWorkoutConsistency(userId: string, days: number = 30): Promise<{
    workoutDays: number;
    totalDays: number;
    consistencyPercentage: number;
    averageWorkoutsPerWeek: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await GoogleFitActivities.findAll({
      where: {
        userId,
        startTime: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('startTime')), 'date']
      ],
      group: [sequelize.fn('DATE', sequelize.col('startTime'))],
      raw: true
    });

    const workoutDays = activities.length;
    const consistencyPercentage = Math.round((workoutDays / days) * 100);
    const averageWorkoutsPerWeek = Math.round((workoutDays / days) * 7 * 10) / 10;

    return {
      workoutDays,
      totalDays: days,
      consistencyPercentage,
      averageWorkoutsPerWeek
    };
  }
}

GoogleFitActivities.init(
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
    activityType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    distance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    steps: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GoogleFitActivities',
    tableName: 'google_fit_activities',
    timestamps: false,
  }
);

// Define associations
GoogleFitActivities.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GoogleFitActivities, { foreignKey: 'userId', as: 'googleFitActivities' });

export default GoogleFitActivities; 