import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface MoodEntryAttributes {
  id: string;
  userId: string;
  moodValue: number;
  moodCategory?: string;
  notes?: string;
  createdAt: Date;
}

interface MoodEntryCreationAttributes extends Optional<MoodEntryAttributes, 'id' | 'createdAt'> {}

class MoodEntry extends Model<MoodEntryAttributes, MoodEntryCreationAttributes> implements MoodEntryAttributes {
  public id!: string;
  public userId!: string;
  public moodValue!: number;
  public moodCategory?: string;
  public notes?: string;
  public createdAt!: Date;
}

MoodEntry.init(
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
    moodValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
      },
    },
    moodCategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    notes: {
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
    modelName: 'MoodEntry',
    tableName: 'mood_entries',
    timestamps: false,
  }
);

MoodEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(MoodEntry, { foreignKey: 'userId', as: 'moodEntries' });

export default MoodEntry;