import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface PushDeviceAttributes {
  id: string;
  userId: string;
  expoPushToken: string;
  platform: string;
  deviceModel?: string | null;
  lastSeen: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PushDeviceCreationAttributes extends Optional<PushDeviceAttributes, 'id' | 'deviceModel' | 'lastSeen' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class PushDevice extends Model<PushDeviceAttributes, PushDeviceCreationAttributes> implements PushDeviceAttributes {
  public id!: string;
  public userId!: string;
  public expoPushToken!: string;
  public platform!: string;
  public deviceModel!: string | null;
  public lastSeen!: Date;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
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
      references: {
        model: User,
        key: 'id',
      },
    },
    expoPushToken: {
      type: DataTypes.STRING(300),
      allowNull: false,
      unique: false,
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    deviceModel: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
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
    updatedAt: 'updatedAt',
    createdAt: 'createdAt',
  }
);

PushDevice.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PushDevice, { foreignKey: 'userId', as: 'pushDevices' });

export default PushDevice; 