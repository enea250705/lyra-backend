import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface CalendarEventAttributes {
  id: string;
  userId: string;
  externalId?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  category?: string;
  location?: string;
  attendees?: string[];
  status?: 'confirmed' | 'tentative' | 'cancelled';
  recurringEventId?: string;
  calendarId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CalendarEventCreationAttributes extends Omit<CalendarEventAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class CalendarEvent extends Model<CalendarEventAttributes, CalendarEventCreationAttributes> 
  implements CalendarEventAttributes {
  public id!: string;
  public userId!: string;
  public externalId?: string;
  public title!: string;
  public description?: string;
  public startTime!: Date;
  public endTime!: Date;
  public isAllDay!: boolean;
  public category?: string;
  public location?: string;
  public attendees?: string[];
  public status?: 'confirmed' | 'tentative' | 'cancelled';
  public recurringEventId?: string;
  public calendarId?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public static associations: {
    user: Association<CalendarEvent, User>;
  };

  // Instance methods
  public getDuration(): number {
    return this.endTime.getTime() - this.startTime.getTime();
  }

  public isToday(): boolean {
    const today = new Date();
    const eventDate = new Date(this.startTime);
    return eventDate.toDateString() === today.toDateString();
  }

  public isTomorrow(): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const eventDate = new Date(this.startTime);
    return eventDate.toDateString() === tomorrow.toDateString();
  }

  public isUpcoming(): boolean {
    return this.startTime > new Date();
  }

  public formatTimeRange(): string {
    const startTime = this.startTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    const endTime = this.endTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    return `${startTime} - ${endTime}`;
  }

  public canBeRescheduled(): boolean {
    // Can reschedule if event is in the future and not cancelled
    return this.isUpcoming() && this.status !== 'cancelled';
  }
}

CalendarEvent.init(
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
    externalId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Google Calendar event ID'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isAllDay: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    attendees: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'tentative', 'cancelled'),
      defaultValue: 'confirmed',
    },
    recurringEventId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID of the recurring event series'
    },
    calendarId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Google Calendar ID this event belongs to'
    },
  },
  {
    sequelize,
    modelName: 'CalendarEvent',
    tableName: 'calendar_events',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'start_time']
      },
      {
        fields: ['external_id']
      },
      {
        fields: ['status']
      }
    ]
  }
);

// Define associations
CalendarEvent.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(CalendarEvent, {
  foreignKey: 'userId',
  as: 'calendarEvents',
});

export default CalendarEvent; 