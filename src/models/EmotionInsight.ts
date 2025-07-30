import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface EmotionInsightAttributes {
  id: string;
  userId: string;
  insightType: string;
  data: any;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

interface EmotionInsightCreationAttributes extends Optional<EmotionInsightAttributes, 'id' | 'createdAt'> {}

class EmotionInsight extends Model<EmotionInsightAttributes, EmotionInsightCreationAttributes> implements EmotionInsightAttributes {
  public id!: string;
  public userId!: string;
  public insightType!: string;
  public data!: any;
  public periodStart!: Date;
  public periodEnd!: Date;
  public createdAt!: Date;
}

EmotionInsight.init(
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
    insightType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    periodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    periodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'EmotionInsight',
    tableName: 'emotion_insights',
    timestamps: false,
  }
);

EmotionInsight.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(EmotionInsight, { foreignKey: 'userId', as: 'emotionInsights' });

export default EmotionInsight;