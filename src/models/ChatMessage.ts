import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface ChatMessageAttributes {
  id: string;
  userId: string;
  text: string;
  sender: 'user' | 'lyra';
  isVoice: boolean;
  createdAt: Date;
}

interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id' | 'createdAt'> {}

class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> implements ChatMessageAttributes {
  public id!: string;
  public userId!: string;
  public text!: string;
  public sender!: 'user' | 'lyra';
  public isVoice!: boolean;
  public createdAt!: Date;
}

ChatMessage.init(
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
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sender: {
      type: DataTypes.ENUM('user', 'lyra'),
      allowNull: false,
    },
    isVoice: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timestamps: false,
  }
);

export default ChatMessage; 