import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface AnalyticsReportAttributes {
  id: string;
  userId?: string; // null for global reports
  reportType: 'user_summary' | 'feature_usage' | 'behavior_analysis' | 'retention' | 'conversion' | 'engagement';
  reportName: string;
  reportData: any;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: any;
  generatedAt: Date;
  createdAt: Date;
}

interface AnalyticsReportCreationAttributes extends Optional<AnalyticsReportAttributes, 'id' | 'createdAt'> {}

class AnalyticsReport extends Model<AnalyticsReportAttributes, AnalyticsReportCreationAttributes> implements AnalyticsReportAttributes {
  public id!: string;
  public userId?: string;
  public reportType!: 'user_summary' | 'feature_usage' | 'behavior_analysis' | 'retention' | 'conversion' | 'engagement';
  public reportName!: string;
  public reportData!: any;
  public dateRange!: {
    start: Date;
    end: Date;
  };
  public filters?: any;
  public generatedAt!: Date;
  public createdAt!: Date;
}

AnalyticsReport.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    reportType: {
      type: DataTypes.ENUM('user_summary', 'feature_usage', 'behavior_analysis', 'retention', 'conversion', 'engagement'),
      allowNull: false,
    },
    reportName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    reportData: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    dateRange: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    filters: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AnalyticsReport',
    tableName: 'analytics_reports',
    timestamps: false,
  }
);

AnalyticsReport.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default AnalyticsReport;

