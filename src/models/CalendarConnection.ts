import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface CalendarConnectionAttributes {
  id: string;
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CalendarConnectionCreationAttributes extends Omit<CalendarConnectionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CalendarConnection extends Model<CalendarConnectionAttributes, CalendarConnectionCreationAttributes> 
  implements CalendarConnectionAttributes {
  public id!: string;
  public userId!: string;
  public provider!: string;
  public accessToken!: string;
  public refreshToken!: string;
  public expiresAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    user: Association<CalendarConnection, User>;
  };

  // Instance methods
  public isTokenExpired(): boolean {
    return new Date() >= this.expiresAt;
  }

  public needsRefresh(): boolean {
    // Refresh if token expires within 5 minutes
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return fiveMinutesFromNow >= this.expiresAt;
  }
}

CalendarConnection.init(
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
      onDelete: 'CASCADE',
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['google', 'apple', 'outlook']]
      }
    },
    accessToken: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'CalendarConnection',
    tableName: 'calendar_connections',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'provider']
      }
    ]
  }
);

// Define associations
CalendarConnection.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(CalendarConnection, {
  foreignKey: 'userId',
  as: 'calendarConnections',
});

export default CalendarConnection; 