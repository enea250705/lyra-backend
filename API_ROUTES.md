# Lyra AI Backend - Complete API Routes

## Base URL: `/api/v1`

## Authentication Routes (`/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout (requires auth)
- `GET /profile` - Get user profile (requires auth)
- `PUT /profile` - Update user profile (requires auth)

## Daily Check-ins Routes (`/checkins`)
- `POST /` - Create daily check-in (requires auth)
- `GET /` - Get paginated check-ins (requires auth)
- `GET /today` - Get today's check-in (requires auth)
- `GET /:id` - Get specific check-in (requires auth)
- `PUT /:id` - Update check-in (requires auth)
- `DELETE /:id` - Delete check-in (requires auth)

## Mood Tracking Routes (`/mood`)
- `POST /` - Create mood entry (requires auth)
- `GET /` - Get paginated mood entries (requires auth)
- `GET /trends` - Get mood trends (requires auth)
- `GET /:id` - Get specific mood entry (requires auth)
- `PUT /:id` - Update mood entry (requires auth)
- `DELETE /:id` - Delete mood entry (requires auth)

## Energy Tracking Routes (`/energy`)
- `POST /` - Create energy entry (requires auth)
- `GET /` - Get paginated energy entries (requires auth)
- `GET /trends` - Get energy trends (requires auth)
- `GET /:id` - Get specific energy entry (requires auth)
- `PUT /:id` - Update energy entry (requires auth)
- `DELETE /:id` - Delete energy entry (requires auth)

## Sleep Tracking Routes (`/sleep`)
- `POST /` - Create sleep log (requires auth)
- `GET /` - Get paginated sleep logs (requires auth)
- `GET /trends` - Get sleep trends (requires auth)
- `GET /:id` - Get specific sleep log (requires auth)
- `PUT /:id` - Update sleep log (requires auth)
- `DELETE /:id` - Delete sleep log (requires auth)

## Focus Session Routes (`/focus`)
- `POST /start` - Start focus session (requires auth)
- `POST /:id/end` - End focus session (requires auth)
- `GET /` - Get paginated focus sessions (requires auth)
- `GET /active` - Get active focus session (requires auth)
- `GET /:id` - Get specific focus session (requires auth)
- `DELETE /:id` - Delete focus session (requires auth)

## Journal Routes (`/journal`)
- `POST /` - Create journal entry (requires auth)
- `GET /` - Get paginated journal entries (requires auth)
- `GET /:id` - Get specific journal entry (requires auth)
- `PUT /:id` - Update journal entry (requires auth)
- `DELETE /:id` - Delete journal entry (requires auth)

## Calendar Routes (`/calendar`)
- `POST /connect` - Connect calendar (Google/Apple) (requires auth)
- `GET /events` - Get calendar events (requires auth)
- `GET /free-slots` - Get free time slots (requires auth)
- `DELETE /connection/:id` - Disconnect calendar (requires auth)

## Financial Routes (`/finance`)
- `POST /connect` - Connect bank account (requires auth)
- `GET /transactions` - Get transactions (requires auth)
- `GET /summary` - Get spending summary (requires auth)
- `POST /limits` - Set spending limits (requires auth)
- `GET /limits` - Get spending limits (requires auth)
- `DELETE /connection/:id` - Disconnect bank (requires auth)

## Insights Routes (`/insights`)
- `GET /emotions` - Get emotion insights (requires auth)
- `GET /correlations` - Get data correlations (requires auth)
- `GET /weekly-summary` - Get weekly summary (requires auth)

## Notifications Routes (`/notifications`)
- `GET /` - Get notifications (requires auth)
- `PUT /:id/read` - Mark notification as read (requires auth)
- `GET /settings` - Get notification settings (requires auth)
- `PUT /settings` - Update notification settings (requires auth)

## Settings Routes (`/settings`)
- `GET /` - Get user settings (requires auth)
- `PUT /` - Update user settings (requires auth)

## Analytics Routes (`/analytics`)
- `POST /track` - Track usage event (requires auth)
- `GET /dashboard` - Get analytics dashboard (admin only)

## System Routes
- `GET /health` - Health check
- `GET /api/docs` - API documentation (Swagger UI)

## Common Request/Response Patterns

### Authentication Header
```
Authorization: Bearer <jwt_token>
```

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "errors": [ ... ] // validation errors
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Rate Limiting

- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes
- Strict endpoints: 10 requests per 15 minutes

## Security Features

- JWT-based authentication
- bcrypt password hashing
- Input validation with Joi
- Rate limiting
- CORS protection
- Helmet security headers
- Request logging