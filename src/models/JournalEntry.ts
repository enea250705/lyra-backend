import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface JournalEntryAttributes {
  id: string;
  userId: string;
  title?: string;
  content?: string;
  voiceUrl?: string;
  encryptedContent?: Buffer;
  isEncrypted: boolean;
  pinProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface JournalEntryCreationAttributes extends Optional<JournalEntryAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class JournalEntry extends Model<JournalEntryAttributes, JournalEntryCreationAttributes> implements JournalEntryAttributes {
  public id!: string;
  public userId!: string;
  public title?: string;
  public content?: string;
  public voiceUrl?: string;
  public encryptedContent?: Buffer;
  public isEncrypted!: boolean;
  public pinProtected!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

JournalEntry.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    voiceUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    encryptedContent: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    isEncrypted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pinProtected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    modelName: 'JournalEntry',
    tableName: 'journal_entries',
    timestamps: true,
  }
);

JournalEntry.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(JournalEntry, { foreignKey: 'userId', as: 'journalEntries' });

export default JournalEntry;