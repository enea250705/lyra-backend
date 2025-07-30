import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface UserSettingsAttributes {
  id: string;
  userId: string;
  theme: string;
  aiTone: string;
  timezone: string;
  language: string;
  featuresEnabled: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

interface UserSettingsCreationAttributes extends Optional<UserSettingsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class UserSettings extends Model<UserSettingsAttributes, UserSettingsCreationAttributes> implements UserSettingsAttributes {
  public id!: string;
  public userId!: string;
  public theme!: string;
  public aiTone!: string;
  public timezone!: string;
  public language!: string;
  public featuresEnabled!: Record<string, boolean>;
  public createdAt!: Date;
  public updatedAt!: Date;
}

UserSettings.init(
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
    theme: {
      type: DataTypes.STRING(20),
      defaultValue: 'light',
    },
    aiTone: {
      type: DataTypes.STRING(50),
      defaultValue: 'friendly',
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'UTC',
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'en',
    },
    featuresEnabled: {
      type: DataTypes.JSONB,
      defaultValue: {
        mood: true,
        energy: true,
        sleep: true,
        focus: true,
        journal: true,
        calendar: true,
        finance: true,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'UserSettings',
    tableName: 'user_settings',
    timestamps: true,
  }
);

UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserSettings, { foreignKey: 'userId', as: 'userSettings' });

export default UserSettings;