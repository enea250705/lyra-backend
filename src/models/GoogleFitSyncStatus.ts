import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

type DataType = 'steps' | 'heart_rate' | 'activities' | 'sleep' | 'weight';
type SyncStatus = 'success' | 'partial' | 'failed';

class GoogleFitSyncStatus extends Model {
  public id!: string;
  public userId!: string;
  public dataType!: DataType;
  public lastSyncAt!: Date;
  public lastSyncDate!: string;
  public syncStatus!: SyncStatus;
  public errorMessage!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Associations
  public static associations: {
    user: Association<GoogleFitSyncStatus, User>;
  };

  // Instance methods
  public isStale(maxAgeHours: number = 24): boolean {
    const maxAge = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    return this.lastSyncAt < maxAge;
  }

  public needsResync(): boolean {
    return this.syncStatus === 'failed' || this.isStale();
  }

  public async updateSyncSuccess(syncDate: Date): Promise<void> {
    this.lastSyncAt = new Date();
    this.lastSyncDate = syncDate.toISOString().split('T')[0];
    this.syncStatus = 'success';
    this.errorMessage = '';
    await this.save();
  }

  public async updateSyncFailure(errorMessage: string): Promise<void> {
    this.lastSyncAt = new Date();
    this.syncStatus = 'failed';
    this.errorMessage = errorMessage;
    await this.save();
  }

  public async updateSyncPartial(syncDate: Date, errorMessage: string): Promise<void> {
    this.lastSyncAt = new Date();
    this.lastSyncDate = syncDate.toISOString().split('T')[0];
    this.syncStatus = 'partial';
    this.errorMessage = errorMessage;
    await this.save();
  }

  // Static methods for sync management
  public static async getSyncStatusForUser(userId: string): Promise<GoogleFitSyncStatus[]> {
    return await GoogleFitSyncStatus.findAll({
      where: { userId },
      order: [['dataType', 'ASC']]
    });
  }

  public static async getLastSyncDate(userId: string, dataType: DataType): Promise<Date | null> {
    const syncStatus = await GoogleFitSyncStatus.findOne({
      where: { userId, dataType }
    });

    if (!syncStatus || syncStatus.syncStatus === 'failed') {
      // If no successful sync or last sync failed, start from 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return thirtyDaysAgo;
    }

    return new Date(syncStatus.lastSyncDate);
  }

  public static async initializeUserSyncStatuses(userId: string): Promise<void> {
    const dataTypes: DataType[] = ['steps', 'heart_rate', 'activities', 'sleep', 'weight'];
    
    for (const dataType of dataTypes) {
      const existing = await GoogleFitSyncStatus.findOne({
        where: { userId, dataType }
      });

      if (!existing) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await GoogleFitSyncStatus.create({
          userId,
          dataType,
          lastSyncAt: new Date(),
          lastSyncDate: thirtyDaysAgo.toISOString().split('T')[0],
          syncStatus: 'success'
        });
      }
    }
  }

  public static async getStaleDataTypes(userId: string, maxAgeHours: number = 24): Promise<DataType[]> {
    const syncStatuses = await GoogleFitSyncStatus.findAll({
      where: { userId }
    });

    return syncStatuses
      .filter(status => status.isStale(maxAgeHours) || status.syncStatus === 'failed')
      .map(status => status.dataType);
  }

  public static async getOverallSyncHealth(userId: string): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    lastFullSync: Date | null;
    failedDataTypes: DataType[];
    staleDataTypes: DataType[];
    successRate: number;
  }> {
    const syncStatuses = await GoogleFitSyncStatus.findAll({
      where: { userId }
    });

    if (syncStatuses.length === 0) {
      return {
        status: 'critical',
        lastFullSync: null,
        failedDataTypes: [],
        staleDataTypes: [],
        successRate: 0
      };
    }

    const failedDataTypes = syncStatuses
      .filter(s => s.syncStatus === 'failed')
      .map(s => s.dataType);

    const staleDataTypes = syncStatuses
      .filter(s => s.isStale(24))
      .map(s => s.dataType);

    const successfulSyncs = syncStatuses.filter(s => s.syncStatus === 'success').length;
    const successRate = Math.round((successfulSyncs / syncStatuses.length) * 100);

    // Find the most recent full sync (all data types synced successfully)
    const allDataTypes: DataType[] = ['steps', 'heart_rate', 'activities', 'sleep', 'weight'];
    const successfulStatuses = syncStatuses.filter(s => s.syncStatus === 'success');
    
    let lastFullSync: Date | null = null;
    if (successfulStatuses.length === allDataTypes.length) {
      const oldestSuccessfulSync = successfulStatuses.reduce((oldest, current) => 
        current.lastSyncAt < oldest.lastSyncAt ? current : oldest
      );
      lastFullSync = oldestSuccessfulSync.lastSyncAt;
    }

    let status: 'healthy' | 'degraded' | 'critical';
    if (failedDataTypes.length === 0 && staleDataTypes.length === 0) {
      status = 'healthy';
    } else if (failedDataTypes.length <= 1 && staleDataTypes.length <= 2) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    return {
      status,
      lastFullSync,
      failedDataTypes,
      staleDataTypes,
      successRate
    };
  }

  public static async resetUserSyncStatuses(userId: string): Promise<void> {
    await GoogleFitSyncStatus.destroy({
      where: { userId }
    });
    await GoogleFitSyncStatus.initializeUserSyncStatuses(userId);
  }
}

GoogleFitSyncStatus.init(
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
    dataType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['steps', 'heart_rate', 'activities', 'sleep', 'weight']]
      }
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lastSyncDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    syncStatus: {
      type: DataTypes.STRING(20),
      defaultValue: 'success',
      validate: {
        isIn: [['success', 'partial', 'failed']]
      }
    },
    errorMessage: {
      type: DataTypes.TEXT,
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
    modelName: 'GoogleFitSyncStatus',
    tableName: 'google_fit_sync_status',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'dataType']
      }
    ]
  }
);

// Define associations
GoogleFitSyncStatus.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(GoogleFitSyncStatus, { foreignKey: 'userId', as: 'googleFitSyncStatuses' });

export default GoogleFitSyncStatus; 