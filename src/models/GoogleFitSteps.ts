import { Model, DataTypes, Association, Op } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class GoogleFitSteps extends Model {
  public id!: string;
  public userId!: string;
  public date!: string;
  public steps!: number;
  public distance!: number;
  public calories!: number;
  public activeMinutes!: number;
  public createdAt!: Date;

  // Associations
  public static associations: {
    user: Association<GoogleFitSteps, User>;
  };

  // Instance methods
  public getDistanceInKm(): number {
    return Math.round((this.distance / 1000) * 100) / 100;
  }

  public getStepsGoalProgress(dailyGoal: number = 10000): number {
    return Math.min(Math.round((this.steps / dailyGoal) * 100), 100);
  }

  public isActiveDay(): boolean {
    return this.steps >= 8000; // WHO recommendation for active day
  }

  // Static methods for analytics
  public static async getWeeklyAverage(userId: string, startDate: Date): Promise<number> {
    const weekAgo = new Date(startDate);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const steps = await GoogleFitSteps.findAll({
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

    if (steps.length === 0) return 0;
    return Math.round(steps.reduce((sum, s) => sum + s.steps, 0) / steps.length);
  }

  public static async getMonthlyTotal(userId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const steps = await GoogleFitSteps.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ]
        }
      }
    });

    return steps.reduce((sum, s) => sum + s.steps, 0);
  }

  public static async getActiveDaysCount(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const steps = await GoogleFitSteps.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ]
        },
        steps: {
          [Op.gte]: 8000
        }
      }
    });

    return steps.length;
  }
}

GoogleFitSteps.init(
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    steps: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    distance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    calories: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    activeMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'GoogleFitSteps',
    tableName: 'google_fit_steps',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'date']
      }
    ]
  }
);

// Define associations
GoogleFitSteps.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(GoogleFitSteps, { foreignKey: 'user_id', as: 'googleFitSteps' });

export default GoogleFitSteps; 