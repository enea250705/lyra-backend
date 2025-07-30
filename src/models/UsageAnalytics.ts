import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface UsageAnalyticsAttributes {
  id: string;
  userId: string;
  featureName: string;
  action: string;
  metadata?: any;
  createdAt: Date;
}

interface UsageAnalyticsCreationAttributes extends Optional<UsageAnalyticsAttributes, 'id' | 'createdAt'> {}

class UsageAnalytics extends Model<UsageAnalyticsAttributes, UsageAnalyticsCreationAttributes> implements UsageAnalyticsAttributes {
  public id!: string;
  public userId!: string;
  public featureName!: string;
  public action!: string;
  public metadata?: any;
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
      references: {
        model: User,
        key: 'id',
      },
    },
    featureName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    metadata: {
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
    modelName: 'UsageAnalytics',
    tableName: 'usage_analytics',
    timestamps: false,
  }
);

UsageAnalytics.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UsageAnalytics, { foreignKey: 'userId', as: 'usageAnalytics' });

export default UsageAnalytics;