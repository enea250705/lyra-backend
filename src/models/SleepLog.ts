import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface SleepLogAttributes {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  qualityRating: number;
  notes?: string;
  createdAt: Date;
}

interface SleepLogCreationAttributes extends Optional<SleepLogAttributes, 'id' | 'createdAt'> {}

class SleepLog extends Model<SleepLogAttributes, SleepLogCreationAttributes> implements SleepLogAttributes {
  public id!: string;
  public userId!: string;
  public startTime!: Date;
  public endTime!: Date;
  public qualityRating!: number;
  public notes?: string;
  public createdAt!: Date;

  public getDuration(): number {
    return Math.abs(this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60 * 60);
  }
}

SleepLog.init(
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
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    qualityRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'SleepLog',
    tableName: 'sleep_logs',
    timestamps: false,
  }
);

SleepLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(SleepLog, { foreignKey: 'userId', as: 'sleepLogs' });

export default SleepLog;