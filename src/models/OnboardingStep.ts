import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface OnboardingStepAttributes {
  id: string;
  userId: string;
  stepName: string;
  stepType: 'welcome' | 'profile_setup' | 'permissions' | 'feature_intro' | 'goal_setting' | 'preferences' | 'completion';
  stepOrder: number;
  isCompleted: boolean;
  completedAt?: Date;
  stepData?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface OnboardingStepCreationAttributes extends Optional<OnboardingStepAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class OnboardingStep extends Model<OnboardingStepAttributes, OnboardingStepCreationAttributes> implements OnboardingStepAttributes {
  public id!: string;
  public userId!: string;
  public stepName!: string;
  public stepType!: 'welcome' | 'profile_setup' | 'permissions' | 'feature_intro' | 'goal_setting' | 'preferences' | 'completion';
  public stepOrder!: number;
  public isCompleted!: boolean;
  public completedAt?: Date;
  public stepData?: any;
  public createdAt!: Date;
  public updatedAt!: Date;
}

OnboardingStep.init(
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
    stepName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    stepType: {
      type: DataTypes.ENUM('welcome', 'profile_setup', 'permissions', 'feature_intro', 'goal_setting', 'preferences', 'completion'),
      allowNull: false,
    },
    stepOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stepData: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    modelName: 'OnboardingStep',
    tableName: 'onboarding_steps',
    timestamps: true,
  }
);

OnboardingStep.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default OnboardingStep;

