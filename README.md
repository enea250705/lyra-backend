# Lyra AI Backend

Complete backend API for Lyra AI - Personal Life Operating System

## Features

- **User Authentication**: JWT-based secure authentication with refresh tokens
- **Daily AI Check-ins**: Record daily thoughts, moods, and receive AI reflections
- **Mood & Energy Tracking**: Track mood and energy levels with trend analysis
- **Sleep Tracking**: Log sleep patterns and quality ratings
- **Focus Sessions**: Time-based focus tracking with completion metrics
- **Private Journaling**: Encrypted journal entries with optional PIN protection
- **Smart Calendar Integration**: Google/Apple calendar integration
- **Emotion Insights**: AI-powered analysis of emotional patterns
- **Financial Awareness**: Banking integration with transaction categorization
- **Notifications System**: Customizable reminders and push notifications
- **User Settings**: Personalized preferences and feature toggles
- **Analytics**: Usage tracking and insights

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT with bcrypt password hashing
- **Documentation**: Swagger/OpenAPI 3.0
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston
- **Validation**: Joi

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration.

4. Set up the database:
   ```bash
   # Create database
   createdb lyra_ai
   
   # Run migrations (if using Sequelize migrations)
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

### API Documentation

Interactive API documentation is available at:
`http://localhost:3000/api/docs`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/profile` - Get user profile
- `PUT /api/v1/auth/profile` - Update user profile

### Daily Check-ins
- `POST /api/v1/checkins` - Create daily check-in
- `GET /api/v1/checkins` - Get paginated check-ins
- `GET /api/v1/checkins/today` - Get today's check-in
- `GET /api/v1/checkins/:id` - Get specific check-in
- `PUT /api/v1/checkins/:id` - Update check-in
- `DELETE /api/v1/checkins/:id` - Delete check-in

### Mood Tracking
- `POST /api/v1/mood` - Create mood entry
- `GET /api/v1/mood` - Get paginated mood entries
- `GET /api/v1/mood/trends` - Get mood trends
- `GET /api/v1/mood/:id` - Get specific mood entry
- `PUT /api/v1/mood/:id` - Update mood entry
- `DELETE /api/v1/mood/:id` - Delete mood entry

### Energy Tracking
- `POST /api/v1/energy` - Create energy entry
- `GET /api/v1/energy` - Get paginated energy entries
- `GET /api/v1/energy/trends` - Get energy trends
- `GET /api/v1/energy/:id` - Get specific energy entry
- `PUT /api/v1/energy/:id` - Update energy entry
- `DELETE /api/v1/energy/:id` - Delete energy entry

## Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts and authentication
- `daily_checkins` - Daily AI check-ins
- `mood_entries` - Mood tracking data
- `energy_entries` - Energy level tracking
- `sleep_logs` - Sleep tracking data
- `focus_sessions` - Focus session logs
- `journal_entries` - Private journal entries
- `calendar_events` - Calendar integration data
- `transactions` - Financial transaction data
- `notifications` - Notification management
- `user_settings` - User preferences
- `usage_analytics` - Usage tracking

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **Password Security**: bcrypt hashing with salting
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: Various HTTP security headers
- **Encryption**: AES encryption for sensitive data

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run migrate` - Run database migrations

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic services
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── app.ts          # Main application file
```

## Deployment

### Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details