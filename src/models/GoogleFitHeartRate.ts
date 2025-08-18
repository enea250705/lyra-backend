import { Model, DataTypes, Association, Op } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class GoogleFitHeartRate extends Model {
  public id!: string;
  public userId!: string;
  public timestamp!: Date;
  public bpm!: number;
  public accuracy!: number;
  public createdAt!: Date;

  // Associations
  public static associations: {
    user: Association<GoogleFitHeartRate, User>;
  };

  // Instance methods
  public getHeartRateZone(): string {
    if (this.bpm < 60) return 'Resting';
    if (this.bpm < 100) return 'Normal';
    if (this.bpm < 120) return 'Elevated';
    if (this.bpm < 150) return 'Moderate';
    if (this.bpm < 180) return 'Vigorous';
    return 'Maximum';
  }

  public isInTargetZone(age: number): boolean {
    const maxHR = 220 - age;
    const targetZoneLow = maxHR * 0.5;
    const targetZoneHigh = maxHR * 0.85;
    return this.bpm >= targetZoneLow && this.bpm <= targetZoneHigh;
  }

  // Static methods for analytics
  public static async getAverageForDay(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const heartRates = await GoogleFitHeartRate.findAll({
      where: {
        userId,
        timestamp: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    if (heartRates.length === 0) return 0;
    return Math.round(heartRates.reduce((sum, hr) => sum + hr.bpm, 0) / heartRates.length);
  }

  public static async getRestingHeartRate(userId: string, date: Date): Promise<number> {
    // Get heart rate between 2 AM and 6 AM (typical resting period)
    const startResting = new Date(date);
    startResting.setHours(2, 0, 0, 0);
    const endResting = new Date(date);
    endResting.setHours(6, 0, 0, 0);

    const restingHeartRates = await GoogleFitHeartRate.findAll({
      where: {
        userId,
        timestamp: {
          [Op.between]: [startResting, endResting]
        }
      },
      order: [['bpm', 'ASC']],
      limit: 10 // Get lowest 10 readings
    });

    if (restingHeartRates.length === 0) return 0;
    return Math.round(restingHeartRates.reduce((sum, hr) => sum + hr.bpm, 0) / restingHeartRates.length);
  }

  public static async getHeartRateVariability(userId: string, startDate: Date, endDate: Date): Promise<{
    min: number;
    max: number;
    average: number;
    variance: number;
  }> {
    const heartRates = await GoogleFitHeartRate.findAll({
      where: {
        userId,
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    if (heartRates.length === 0) {
      return { min: 0, max: 0, average: 0, variance: 0 };
    }

    const bpmValues = heartRates.map(hr => hr.bpm);
    const min = Math.min(...bpmValues);
    const max = Math.max(...bpmValues);
    const average = Math.round(bpmValues.reduce((sum, bpm) => sum + bpm, 0) / bpmValues.length);
    
    // Calculate variance
    const squaredDiffs = bpmValues.map(bpm => Math.pow(bpm - average, 2));
    const variance = Math.round(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / bpmValues.length);

    return { min, max, average, variance };
  }
}

GoogleFitHeartRate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: User,
        key: 'id',
      },
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bpm: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 30,
        max: 250,
      },
    },
    accuracy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GoogleFitHeartRate',
    tableName: 'google_fit_heart_rate',
    timestamps: false,
  }
);

// Define associations
GoogleFitHeartRate.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(GoogleFitHeartRate, { foreignKey: 'user_id', as: 'googleFitHeartRates' });

export default GoogleFitHeartRate; 