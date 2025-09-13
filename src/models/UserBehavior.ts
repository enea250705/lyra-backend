import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface UserBehaviorAttributes {
  id: string;
  userId: string;
  sessionId: string;
  eventType: 'page_view' | 'click' | 'scroll' | 'focus' | 'blur' | 'form_submit' | 'api_call';
  eventName: string;
  pageUrl?: string;
  elementId?: string;
  elementType?: string;
  elementText?: string;
  scrollDepth?: number;
  timeOnPage?: number;
  metadata?: any;
  createdAt: Date;
}

interface UserBehaviorCreationAttributes extends Optional<UserBehaviorAttributes, 'id' | 'createdAt'> {}

class UserBehavior extends Model<UserBehaviorAttributes, UserBehaviorCreationAttributes> implements UserBehaviorAttributes {
  public id!: string;
  public userId!: string;
  public sessionId!: string;
  public eventType!: 'page_view' | 'click' | 'scroll' | 'focus' | 'blur' | 'form_submit' | 'api_call';
  public eventName!: string;
  public pageUrl?: string;
  public elementId?: string;
  public elementType?: string;
  public elementText?: string;
  public scrollDepth?: number;
  public timeOnPage?: number;
  public metadata?: any;
  public createdAt!: Date;
}

UserBehavior.init(
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
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    eventType: {
      type: DataTypes.ENUM('page_view', 'click', 'scroll', 'focus', 'blur', 'form_submit', 'api_call'),
      allowNull: false,
    },
    eventName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    pageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    elementId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    elementType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    elementText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scrollDepth: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    timeOnPage: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    modelName: 'UserBehavior',
    tableName: 'user_behaviors',
    timestamps: false,
  }
);

UserBehavior.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default UserBehavior;

