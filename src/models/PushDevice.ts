import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface PushDeviceAttributes {
  id: string;
  userId: string;
  expoPushToken: string;
  platform: 'ios' | 'android' | 'unknown';
  deviceModel?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type PushDeviceCreationAttributes = Optional<PushDeviceAttributes, 'id' | 'platform' | 'deviceModel' | 'isActive' | 'createdAt' | 'updatedAt'>;

class PushDevice extends Model<PushDeviceAttributes, PushDeviceCreationAttributes> implements PushDeviceAttributes {
  public id!: string;
  public userId!: string;
  public expoPushToken!: string;
  public platform!: 'ios' | 'android' | 'unknown';
  public deviceModel!: string | null;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PushDevice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: User, key: 'id' },
    },
    expoPushToken: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    platform: {
      type: DataTypes.ENUM('ios', 'android', 'unknown'),
      allowNull: false,
      defaultValue: 'unknown',
    },
    deviceModel: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    modelName: 'PushDevice',
    tableName: 'push_devices',
    timestamps: true,
  }
);

PushDevice.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default PushDevice;


