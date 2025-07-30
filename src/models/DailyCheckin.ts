import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface DailyCheckinAttributes {
  id: string;
  userId: string;
  content?: string;
  moodEmoji?: string;
  voiceTranscriptionUrl?: string;
  aiReflection?: string;
  createdAt: Date;
}

interface DailyCheckinCreationAttributes extends Optional<DailyCheckinAttributes, 'id' | 'createdAt'> {}

class DailyCheckin extends Model<DailyCheckinAttributes, DailyCheckinCreationAttributes> implements DailyCheckinAttributes {
  public id!: string;
  public userId!: string;
  public content?: string;
  public moodEmoji?: string;
  public voiceTranscriptionUrl?: string;
  public aiReflection?: string;
  public createdAt!: Date;
}

DailyCheckin.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    moodEmoji: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    voiceTranscriptionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    aiReflection: {
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
    modelName: 'DailyCheckin',
    tableName: 'daily_checkins',
    timestamps: false,
  }
);

DailyCheckin.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(DailyCheckin, { foreignKey: 'userId', as: 'dailyCheckins' });

export default DailyCheckin;