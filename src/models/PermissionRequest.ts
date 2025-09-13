import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface PermissionRequestAttributes {
  id: string;
  userId: string;
  permissionType: 'notifications' | 'location' | 'camera' | 'microphone' | 'calendar' | 'health' | 'contacts' | 'storage';
  permissionName: string;
  description: string;
  isGranted: boolean;
  grantedAt?: Date;
  deniedAt?: Date;
  requestReason: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PermissionRequestCreationAttributes extends Optional<PermissionRequestAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PermissionRequest extends Model<PermissionRequestAttributes, PermissionRequestCreationAttributes> implements PermissionRequestAttributes {
  public id!: string;
  public userId!: string;
  public permissionType!: 'notifications' | 'location' | 'camera' | 'microphone' | 'calendar' | 'health' | 'contacts' | 'storage';
  public permissionName!: string;
  public description!: string;
  public isGranted!: boolean;
  public grantedAt?: Date;
  public deniedAt?: Date;
  public requestReason!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

PermissionRequest.init(
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
    permissionType: {
      type: DataTypes.ENUM('notifications', 'location', 'camera', 'microphone', 'calendar', 'health', 'contacts', 'storage'),
      allowNull: false,
    },
    permissionName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isGranted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    grantedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deniedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    requestReason: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    modelName: 'PermissionRequest',
    tableName: 'permission_requests',
    timestamps: true,
  }
);

PermissionRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default PermissionRequest;

