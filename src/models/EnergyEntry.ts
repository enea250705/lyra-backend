import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface EnergyEntryAttributes {
  id: string;
  userId: string;
  energyLevel: number;
  energyEmoji?: string;
  notes?: string;
  createdAt: Date;
}

interface EnergyEntryCreationAttributes extends Optional<EnergyEntryAttributes, 'id' | 'createdAt'> {}

class EnergyEntry extends Model<EnergyEntryAttributes, EnergyEntryCreationAttributes> implements EnergyEntryAttributes {
  public id!: string;
  public userId!: string;
  public energyLevel!: number;
  public energyEmoji?: string;
  public notes?: string;
  public createdAt!: Date;
}

EnergyEntry.init(
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
    energyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 10,
      },
    },
    energyEmoji: {
      type: DataTypes.STRING(10),
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
    modelName: 'EnergyEntry',
    tableName: 'energy_entries',
    timestamps: false,
  }
);

EnergyEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(EnergyEntry, { foreignKey: 'userId', as: 'energyEntries' });

export default EnergyEntry;