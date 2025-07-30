import { Model, DataTypes, Association, Op } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class GoogleFitWeight extends Model {
  public id!: string;
  public userId!: string;
  public timestamp!: Date;
  public weightKg!: number;
  public bodyFatPercentage!: number;
  public muscleMassKg!: number;
  public createdAt!: Date;

  // Associations
  public static associations: {
    user: Association<GoogleFitWeight, User>;
  };

  // Instance methods
  public getWeightInLbs(): number {
    return Math.round(this.weightKg * 2.20462 * 10) / 10;
  }

  public getBMI(heightCm: number): number {
    const heightM = heightCm / 100;
    return Math.round((this.weightKg / (heightM * heightM)) * 10) / 10;
  }

  public getBMICategory(heightCm: number): string {
    const bmi = this.getBMI(heightCm);
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obesity';
  }

  public getBodyFatCategory(age: number, gender: 'male' | 'female'): string {
    if (!this.bodyFatPercentage) return 'Unknown';
    
    // Body fat categories based on age and gender
    const categories = {
      male: {
        essential: [2, 5],
        athletes: [6, 13],
        fitness: [14, 17],
        average: [18, 24],
        obese: [25, 100]
      },
      female: {
        essential: [10, 13],
        athletes: [14, 20],
        fitness: [21, 24],
        average: [25, 31],
        obese: [32, 100]
      }
    };

    const ranges = categories[gender];
    const fatPercent = this.bodyFatPercentage;

    if (fatPercent >= ranges.essential[0] && fatPercent <= ranges.essential[1]) return 'Essential fat';
    if (fatPercent >= ranges.athletes[0] && fatPercent <= ranges.athletes[1]) return 'Athletes';
    if (fatPercent >= ranges.fitness[0] && fatPercent <= ranges.fitness[1]) return 'Fitness';
    if (fatPercent >= ranges.average[0] && fatPercent <= ranges.average[1]) return 'Average';
    if (fatPercent >= ranges.obese[0]) return 'Obese';
    return 'Below essential';
  }

  // Static methods for analytics
  public static async getWeightTrend(userId: string, days: number = 30): Promise<{
    currentWeight: number;
    startWeight: number;
    weightChange: number;
    trend: 'gaining' | 'losing' | 'stable';
    averageWeeklyChange: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const weights = await GoogleFitWeight.findAll({
      where: {
        userId,
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['timestamp', 'ASC']]
    });

    if (weights.length < 2) {
      return {
        currentWeight: weights.length > 0 ? weights[0].weightKg : 0,
        startWeight: 0,
        weightChange: 0,
        trend: 'stable',
        averageWeeklyChange: 0
      };
    }

    const startWeight = weights[0].weightKg;
    const currentWeight = weights[weights.length - 1].weightKg;
    const weightChange = Math.round((currentWeight - startWeight) * 100) / 100;
    const averageWeeklyChange = Math.round((weightChange / days) * 7 * 100) / 100;

    let trend: 'gaining' | 'losing' | 'stable' = 'stable';
    if (Math.abs(weightChange) > 0.5) {
      trend = weightChange > 0 ? 'gaining' : 'losing';
    }

    return {
      currentWeight: Math.round(currentWeight * 100) / 100,
      startWeight: Math.round(startWeight * 100) / 100,
      weightChange,
      trend,
      averageWeeklyChange
    };
  }

  public static async getBodyCompositionTrend(userId: string, days: number = 30): Promise<{
    bodyFatTrend: 'increasing' | 'decreasing' | 'stable';
    muscleMassTrend: 'increasing' | 'decreasing' | 'stable';
    bodyFatChange: number;
    muscleMassChange: number;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const measurements = await GoogleFitWeight.findAll({
      where: {
        userId,
        timestamp: {
          [Op.between]: [startDate, endDate]
        },
        bodyFatPercentage: {
          [Op.not]: null
        }
      },
      order: [['timestamp', 'ASC']]
    });

    if (measurements.length < 2) {
      return {
        bodyFatTrend: 'stable',
        muscleMassTrend: 'stable',
        bodyFatChange: 0,
        muscleMassChange: 0
      };
    }

    const startMeasurement = measurements[0];
    const endMeasurement = measurements[measurements.length - 1];

    const bodyFatChange = endMeasurement.bodyFatPercentage - startMeasurement.bodyFatPercentage;
    const muscleMassChange = (endMeasurement.muscleMassKg || 0) - (startMeasurement.muscleMassKg || 0);

    const bodyFatTrend = Math.abs(bodyFatChange) > 1 ? 
      (bodyFatChange > 0 ? 'increasing' : 'decreasing') : 'stable';
    
    const muscleMassTrend = Math.abs(muscleMassChange) > 0.5 ? 
      (muscleMassChange > 0 ? 'increasing' : 'decreasing') : 'stable';

    return {
      bodyFatTrend,
      muscleMassTrend,
      bodyFatChange: Math.round(bodyFatChange * 100) / 100,
      muscleMassChange: Math.round(muscleMassChange * 100) / 100
    };
  }

  public static async getLatestWeight(userId: string): Promise<GoogleFitWeight | null> {
    return await GoogleFitWeight.findOne({
      where: { userId },
      order: [['timestamp', 'DESC']]
    });
  }
}

GoogleFitWeight.init(
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
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    weightKg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 20,
        max: 300,
      },
    },
    bodyFatPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 50,
      },
    },
    muscleMassKg: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GoogleFitWeight',
    tableName: 'google_fit_weight',
    timestamps: false,
  }
);

// Define associations
GoogleFitWeight.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GoogleFitWeight, { foreignKey: 'userId', as: 'googleFitWeights' });

export default GoogleFitWeight; 