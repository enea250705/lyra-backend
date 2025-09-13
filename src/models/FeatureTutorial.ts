import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface FeatureTutorialAttributes {
  id: string;
  userId: string;
  featureName: string;
  tutorialType: 'intro' | 'walkthrough' | 'tip' | 'advanced';
  title: string;
  description: string;
  content: any; // JSON content for tutorial steps
  isCompleted: boolean;
  completedAt?: Date;
  skippedAt?: Date;
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

interface FeatureTutorialCreationAttributes extends Optional<FeatureTutorialAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class FeatureTutorial extends Model<FeatureTutorialAttributes, FeatureTutorialCreationAttributes> implements FeatureTutorialAttributes {
  public id!: string;
  public userId!: string;
  public featureName!: string;
  public tutorialType!: 'intro' | 'walkthrough' | 'tip' | 'advanced';
  public title!: string;
  public description!: string;
  public content!: any;
  public isCompleted!: boolean;
  public completedAt?: Date;
  public skippedAt?: Date;
  public progress!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
}

FeatureTutorial.init(
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
    tutorialType: {
      type: DataTypes.ENUM('intro', 'walkthrough', 'tip', 'advanced'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content: {
      type: DataTypes.JSONB,
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
    skippedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
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
    modelName: 'FeatureTutorial',
    tableName: 'feature_tutorials',
    timestamps: true,
  }
);

FeatureTutorial.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default FeatureTutorial;

