import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SavingsRecordAttributes {
  id: string;
  userId: string;
  amount: number; // Amount saved (positive number)
  reason: string; // Why money was saved (e.g., "Skipped expensive coffee", "Cancelled impulse purchase")
  category: string; // Category (e.g., "food", "shopping", "entertainment")
  originalAmount: number; // What would have been spent
  savedAmount: number; // How much was saved
  triggerType: string; // What triggered the save (e.g., "mood_alert", "location_alert", "ai_suggestion")
  metadata?: Record<string, any>; // Additional data (location, mood at time, etc.)
  createdAt: Date;
  updatedAt: Date;
}

interface SavingsRecordCreationAttributes extends Optional<SavingsRecordAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class SavingsRecord extends Model<SavingsRecordAttributes, SavingsRecordCreationAttributes> implements SavingsRecordAttributes {
  public id!: string;
  public userId!: string;
  public amount!: number;
  public reason!: string;
  public category!: string;
  public originalAmount!: number;
  public savedAmount!: number;
  public triggerType!: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SavingsRecord.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('food', 'shopping', 'entertainment', 'transport', 'subscription', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    originalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'original_amount',
    },
    savedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'saved_amount',
    },
    triggerType: {
      type: DataTypes.ENUM('mood_alert', 'location_alert', 'ai_suggestion', 'manual', 'time_based', 'weather_based'),
      allowNull: false,
      field: 'trigger_type',
      defaultValue: 'manual',
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'SavingsRecord',
    tableName: 'savings_records',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['trigger_type'],
      },
    ],
  }
);

export default SavingsRecord;