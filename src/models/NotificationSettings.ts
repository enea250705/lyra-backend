import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface NotificationSettingsAttributes {
  id: string;
  userId: string;
  moodReminder: boolean;
  moodReminderTime: string;
  journalReminder: boolean;
  journalReminderTime: string;
  sleepReminder: boolean;
  sleepReminderTime: string;
  financeReminder: boolean;
  financeReminderFrequency: string;
  createdAt: Date;
}

interface NotificationSettingsCreationAttributes extends Optional<NotificationSettingsAttributes, 'id' | 'createdAt'> {}

class NotificationSettings extends Model<NotificationSettingsAttributes, NotificationSettingsCreationAttributes> implements NotificationSettingsAttributes {
  public id!: string;
  public userId!: string;
  public moodReminder!: boolean;
  public moodReminderTime!: string;
  public journalReminder!: boolean;
  public journalReminderTime!: string;
  public sleepReminder!: boolean;
  public sleepReminderTime!: string;
  public financeReminder!: boolean;
  public financeReminderFrequency!: string;
  public createdAt!: Date;
}

NotificationSettings.init(
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
    moodReminder: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    moodReminderTime: {
      type: DataTypes.TIME,
      defaultValue: '09:00',
    },
    journalReminder: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    journalReminderTime: {
      type: DataTypes.TIME,
      defaultValue: '21:00',
    },
    sleepReminder: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    sleepReminderTime: {
      type: DataTypes.TIME,
      defaultValue: '22:00',
    },
    financeReminder: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    financeReminderFrequency: {
      type: DataTypes.STRING(20),
      defaultValue: 'daily',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'NotificationSettings',
    tableName: 'notification_settings',
    timestamps: false,
  }
);

NotificationSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(NotificationSettings, { foreignKey: 'userId', as: 'notificationSettings' });

export default NotificationSettings;