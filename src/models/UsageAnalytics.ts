import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface UsageAnalyticsAttributes {
  id: string;
  userId: string;
  eventType: string;
  eventData?: any;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface UsageAnalyticsCreationAttributes extends Optional<UsageAnalyticsAttributes, 'id' | 'createdAt'> {}

class UsageAnalytics extends Model<UsageAnalyticsAttributes, UsageAnalyticsCreationAttributes> implements UsageAnalyticsAttributes {
  public id!: string;
  public userId!: string;
  public eventType!: string;
  public eventData?: any;
  public sessionId?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public createdAt!: Date;
}

UsageAnalytics.init(
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
    eventType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'event_type',
    },
    eventData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'event_data',
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'session_id',
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      field: 'ip_address',
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'UsageAnalytics',
    tableName: 'usage_analytics',
    timestamps: false,
  }
);

UsageAnalytics.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UsageAnalytics, { foreignKey: 'userId', as: 'usageAnalytics' });

export default UsageAnalytics;