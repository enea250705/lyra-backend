import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface FocusSessionAttributes {
  id: string;
  userId: string;
  goal?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  completed: boolean;
  distractionCount: number;
  createdAt: Date;
}

interface FocusSessionCreationAttributes extends Optional<FocusSessionAttributes, 'id' | 'endTime' | 'durationMinutes' | 'completed' | 'distractionCount' | 'createdAt'> {}

class FocusSession extends Model<FocusSessionAttributes, FocusSessionCreationAttributes> implements FocusSessionAttributes {
  public id!: string;
  public userId!: string;
  public goal?: string;
  public startTime!: Date;
  public endTime?: Date;
  public durationMinutes?: number;
  public completed!: boolean;
  public distractionCount!: number;
  public createdAt!: Date;

  public isActive(): boolean {
    return !this.endTime;
  }

  public calculateDuration(): number {
    if (!this.endTime) return 0;
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
}

FocusSession.init(
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
    goal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    distractionCount: {
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
    modelName: 'FocusSession',
    tableName: 'focus_sessions',
    timestamps: false,
  }
);

FocusSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(FocusSession, { foreignKey: 'userId', as: 'focusSessions' });

export default FocusSession;