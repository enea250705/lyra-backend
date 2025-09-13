# Analytics & Reporting System

## Overview

The Lyra AI Analytics & Reporting system provides comprehensive data analysis, user behavior tracking, and visualization capabilities. This system enables both users and administrators to gain insights into app usage patterns, feature adoption, and user engagement.

## Features Implemented

### ✅ **Analytics Service**
- **User Engagement Metrics**: Session duration, bounce rate, return user rate, feature adoption
- **Feature Usage Analytics**: Usage counts, active users, retention rates per feature
- **Behavior Insights**: Page visits, click tracking, scroll behavior, user journey analysis
- **Report Generation**: Automated report creation with multiple report types

### ✅ **User Behavior Tracking**
- **Event Types**: Page views, clicks, scrolls, focus/blur, form submissions, API calls
- **Session Tracking**: User session management with detailed analytics
- **Element Tracking**: Click tracking on specific UI elements
- **Scroll Analytics**: Scroll depth and behavior analysis

### ✅ **Data Visualization**
- **Chart Types**: Line, bar, pie, area, scatter, doughnut, radar charts
- **Dashboard System**: Configurable dashboard with multiple widgets
- **Real-time Data**: Live analytics data with customizable time ranges
- **Export Capabilities**: JSON export for external visualization tools

### ✅ **API Endpoints**
- **Analytics Routes**: Complete REST API for analytics operations
- **Report Management**: Generate, save, retrieve, and delete reports
- **Chart Data**: Dynamic chart data generation
- **Dashboard API**: Dashboard configuration and management

### ✅ **CLI Tools**
- **Analytics CLI**: Command-line interface for analytics operations
- **Report Generation**: Generate reports from command line
- **Data Export**: Export analytics data for external analysis

## Database Schema

### New Tables Created

#### `user_behaviors`
```sql
CREATE TABLE user_behaviors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  event_type ENUM('page_view', 'click', 'scroll', 'focus', 'blur', 'form_submit', 'api_call') NOT NULL,
  event_name VARCHAR(200) NOT NULL,
  page_url TEXT,
  element_id VARCHAR(100),
  element_type VARCHAR(50),
  element_text TEXT,
  scroll_depth INTEGER,
  time_on_page INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `analytics_reports`
```sql
CREATE TABLE analytics_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_type ENUM('user_summary', 'feature_usage', 'behavior_analysis', 'retention', 'conversion', 'engagement') NOT NULL,
  report_name VARCHAR(200) NOT NULL,
  report_data JSONB NOT NULL,
  date_range JSONB NOT NULL,
  filters JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Analytics Routes (`/api/v1/analytics`)

#### Event Tracking
- `POST /track` - Track usage events
- `POST /behavior/track` - Track user behavior events

#### Analytics Data
- `GET /user` - Get user analytics
- `GET /engagement` - Get user engagement metrics
- `GET /features` - Get feature usage metrics
- `GET /behavior/insights` - Get behavior insights
- `GET /adoption` - Get feature adoption statistics

#### Reports
- `POST /reports` - Generate analytics report
- `GET /reports` - Get saved reports
- `GET /reports/:id` - Get specific report
- `DELETE /reports/:id` - Delete report

#### Visualization
- `GET /charts` - Get chart data
- `GET /dashboard` - Get dashboard configuration

## Usage Examples

### Track User Behavior
```javascript
// Track a page view
await fetch('/api/v1/analytics/behavior/track', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    sessionId: 'session_123',
    eventType: 'page_view',
    eventName: 'home_page_view',
    pageUrl: '/dashboard',
    timeOnPage: 45
  })
});

// Track a click event
await fetch('/api/v1/analytics/behavior/track', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    sessionId: 'session_123',
    eventType: 'click',
    eventName: 'button_click',
    elementId: 'save-button',
    elementType: 'button',
    elementText: 'Save Entry'
  })
});
```

### Get Analytics Data
```javascript
// Get user engagement metrics
const engagement = await fetch('/api/v1/analytics/engagement?days=30', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json());

// Get feature usage metrics
const features = await fetch('/api/v1/analytics/features?days=7', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json());

// Get behavior insights
const insights = await fetch('/api/v1/analytics/behavior/insights?days=14', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json());
```

### Generate Reports
```javascript
// Generate a comprehensive report
const report = await fetch('/api/v1/analytics/reports', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    reportType: 'user_summary',
    dateRange: {
      start: '2025-01-01',
      end: '2025-01-31'
    },
    filters: {
      features: ['mood', 'sleep', 'journal']
    }
  })
}).then(r => r.json());
```

### Get Chart Data
```javascript
// Get line chart data for usage trends
const chartData = await fetch('/api/v1/analytics/charts?chartType=line&metric=usage&days=30', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json());

// Get pie chart data for feature distribution
const pieData = await fetch('/api/v1/analytics/charts?chartType=pie&metric=engagement&days=7', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json());
```

## CLI Commands

### Analytics CLI Usage

```bash
# Generate feature usage report
npm run analytics:features -- --days 30

# Get user engagement metrics
npm run analytics:engagement -- --userId "user-id" --days 7

# Generate behavior insights
npm run analytics:behavior -- --userId "user-id" --days 14

# Generate dashboard
npm run analytics:dashboard -- --days 30 --output dashboard.json

# Generate chart data
npm run analytics:chart -- --type bar --metric usage --days 7 --output chart.json

# Track behavior event
npm run analytics:track -- --userId "user-id" --sessionId "session-123" --type click --eventName "button_click"

# Generate comprehensive report
npm run analytics:report -- --type user_summary --userId "user-id" --days 30
```

## Data Models

### UserBehavior Model
```typescript
interface UserBehaviorAttributes {
  id: string;
  userId: string;
  sessionId: string;
  eventType: 'page_view' | 'click' | 'scroll' | 'focus' | 'blur' | 'form_submit' | 'api_call';
  eventName: string;
  pageUrl?: string;
  elementId?: string;
  elementType?: string;
  elementText?: string;
  scrollDepth?: number;
  timeOnPage?: number;
  metadata?: any;
  createdAt: Date;
}
```

### AnalyticsReport Model
```typescript
interface AnalyticsReportAttributes {
  id: string;
  userId?: string;
  reportType: 'user_summary' | 'feature_usage' | 'behavior_analysis' | 'retention' | 'conversion' | 'engagement';
  reportName: string;
  reportData: any;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: any;
  generatedAt: Date;
  createdAt: Date;
}
```

## Metrics and KPIs

### User Engagement Metrics
- **Total Sessions**: Number of user sessions
- **Average Session Duration**: Mean time per session
- **Pages Per Session**: Average pages viewed per session
- **Bounce Rate**: Percentage of single-page sessions
- **Return User Rate**: Percentage of users who return
- **Feature Adoption Rate**: Percentage of features used

### Feature Usage Metrics
- **Total Users**: Users who have used the feature
- **Active Users**: Users who used the feature in the period
- **Usage Count**: Total number of feature uses
- **Average Usage Per User**: Mean usage per active user
- **Retention Rate**: Percentage of users who continue using
- **Last Used**: Most recent usage timestamp

### Behavior Insights
- **Most Visited Pages**: Top pages by visit count
- **Top Clicked Elements**: Most clicked UI elements
- **User Journey**: Step-by-step user flow analysis
- **Scroll Behavior**: Scroll depth distribution and patterns

## Integration Guide

### Frontend Integration

1. **Initialize Analytics Tracking**:
```javascript
// Initialize session
const sessionId = generateSessionId();
localStorage.setItem('analytics_session', sessionId);

// Track page views
trackPageView(sessionId, window.location.pathname);
```

2. **Track User Interactions**:
```javascript
// Track button clicks
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-track]')) {
    trackClick(sessionId, e.target);
  }
});

// Track scroll behavior
let scrollDepth = 0;
window.addEventListener('scroll', throttle(() => {
  const newDepth = Math.round((window.scrollY / document.body.scrollHeight) * 100);
  if (newDepth > scrollDepth) {
    scrollDepth = newDepth;
    trackScroll(sessionId, scrollDepth);
  }
}, 1000));
```

3. **Track Feature Usage**:
```javascript
// Track feature usage
function trackFeatureUsage(featureName, action, metadata = {}) {
  fetch('/api/v1/analytics/track', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({
      featureName,
      action,
      metadata
    })
  });
}

// Usage examples
trackFeatureUsage('mood', 'create_entry', { moodValue: 8 });
trackFeatureUsage('sleep', 'log_sleep', { duration: 7.5 });
trackFeatureUsage('journal', 'save_entry', { wordCount: 150 });
```

## Performance Considerations

### Database Optimization
- **Indexes**: Optimized indexes on frequently queried columns
- **Partitioning**: Consider partitioning large tables by date
- **Archiving**: Archive old analytics data to maintain performance

### Caching Strategy
- **Redis Caching**: Cache frequently accessed analytics data
- **Report Caching**: Cache generated reports for faster access
- **Dashboard Caching**: Cache dashboard configurations

### Data Retention
- **Retention Policy**: Implement data retention policies
- **Data Archival**: Archive old data to reduce storage costs
- **GDPR Compliance**: Ensure user data can be deleted on request

## Security Considerations

### Data Privacy
- **User Consent**: Ensure user consent for analytics tracking
- **Data Anonymization**: Anonymize sensitive user data
- **Access Control**: Restrict analytics access to authorized users

### API Security
- **Authentication**: All endpoints require valid authentication
- **Rate Limiting**: Implement rate limiting for analytics endpoints
- **Input Validation**: Validate all input data

## Monitoring and Alerting

### Key Metrics to Monitor
- **API Response Times**: Monitor analytics API performance
- **Database Performance**: Track query performance
- **Error Rates**: Monitor analytics service errors
- **Data Quality**: Validate analytics data integrity

### Alerting Rules
- **High Error Rate**: Alert on increased error rates
- **Performance Degradation**: Alert on slow response times
- **Data Anomalies**: Alert on unusual data patterns

## Future Enhancements

### Planned Features
- **Real-time Analytics**: Live analytics dashboard
- **Machine Learning**: Predictive analytics and insights
- **A/B Testing**: Built-in A/B testing framework
- **Custom Dashboards**: User-customizable dashboards
- **Data Export**: Export analytics data in various formats
- **Advanced Visualizations**: More chart types and visualizations

### Integration Opportunities
- **Third-party Analytics**: Integration with Google Analytics, Mixpanel
- **Business Intelligence**: Integration with BI tools
- **Data Warehousing**: Export to data warehouses
- **API Integrations**: Webhook integrations for real-time data

## Troubleshooting

### Common Issues

1. **Column Name Errors**: Ensure database column names match Sequelize model definitions
2. **Performance Issues**: Check database indexes and query optimization
3. **Data Inconsistencies**: Validate data integrity and relationships
4. **API Errors**: Check authentication and input validation

### Debug Commands
```bash
# Check migration status
npm run db:migrate:status

# Test analytics endpoints
npm run analytics:features -- --days 1

# Generate test report
npm run analytics:report -- --type user_summary --days 1
```

## Conclusion

The Analytics & Reporting system provides comprehensive insights into user behavior and app usage patterns. With its flexible API, powerful CLI tools, and extensive visualization capabilities, it enables data-driven decision making and continuous improvement of the Lyra AI platform.

The system is designed to scale with the application and provides the foundation for advanced analytics features in the future.

