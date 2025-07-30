import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class GoogleFitConnection extends Model {
  public id!: string;
  public userId!: string;
  public accessToken!: string;
  public refreshToken!: string;
  public tokenExpiresAt!: Date;
  public scope!: string;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associations: {
    user: Association<GoogleFitConnection, User>;
  };

  // Instance methods
  public isTokenExpired(): boolean {
    return new Date() > this.tokenExpiresAt;
  }

  public async deactivate(): Promise<void> {
    this.isActive = false;
    await this.save();
  }

  public async updateTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<void> {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    if (expiresIn) {
      this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    }
    this.isActive = true;
    await this.save();
  }
}

GoogleFitConnection.init(
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
    accessToken: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    scope: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: 'GoogleFitConnection',
    tableName: 'google_fit_connections',
    timestamps: true,
  }
);

// Define associations
GoogleFitConnection.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(GoogleFitConnection, { foreignKey: 'userId', as: 'googleFitConnection' });

export default GoogleFitConnection; 