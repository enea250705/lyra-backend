# Onboarding Flow & Data Visualization System

## Overview

The Lyra AI Onboarding Flow and Data Visualization system provides a comprehensive user experience for new users, including guided setup, permission management, feature introductions, and advanced data visualization capabilities.

## Features Implemented

### ✅ **Onboarding Flow**
- **Guided Setup**: Step-by-step onboarding process for new users
- **Progress Tracking**: Real-time progress tracking with completion percentages
- **Step Management**: Complete, skip, and reset onboarding steps
- **Customizable Flow**: Flexible onboarding steps with JSON data storage

### ✅ **Permission Request Flow**
- **Device Permissions**: Request and manage device permissions (notifications, location, camera, etc.)
- **Permission Tracking**: Track granted/denied permissions with timestamps
- **Reason Tracking**: Store reasons for permission requests
- **Permission Management**: Grant, deny, and track permission status

### ✅ **Feature Introduction System**
- **Interactive Tutorials**: Step-by-step feature tutorials
- **Progress Tracking**: Track tutorial completion progress (0-100%)
- **Tutorial Types**: Intro, walkthrough, tip, and advanced tutorials
- **Skip Functionality**: Allow users to skip tutorials

### ✅ **Data Visualization**
- **Chart Generation**: Multiple chart types (line, bar, pie, area)
- **Trend Analysis**: Analyze trends over time with change percentages
- **Progress Tracking**: Visual progress displays with targets
- **Real-time Data**: Live data visualization with customizable time ranges

## Database Schema

### New Tables Created

#### `onboarding_steps`
```sql
CREATE TABLE onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL,
  step_type ENUM('welcome', 'profile_setup', 'permissions', 'feature_intro', 'goal_setup', 'preferences', 'completion') NOT NULL,
  step_order INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  step_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `permission_requests`
```sql
CREATE TABLE permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_type ENUM('notifications', 'location', 'camera', 'microphone', 'calendar', 'health', 'contacts', 'storage') NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  is_granted BOOLEAN DEFAULT false,
  granted_at TIMESTAMP WITH TIME ZONE,
  denied_at TIMESTAMP WITH TIME ZONE,
  request_reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `feature_tutorials`
```sql
CREATE TABLE feature_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_name VARCHAR(100) NOT NULL,
  tutorial_type ENUM('intro', 'walkthrough', 'tip', 'advanced') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  content JSONB NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  skipped_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Onboarding Routes (`/api/v1/onboarding`)

#### Onboarding Management
- `POST /initialize` - Initialize onboarding flow for new user
- `GET /progress` - Get onboarding progress
- `POST /complete-step` - Complete onboarding step
- `POST /skip-step` - Skip onboarding step
- `GET /complete` - Check if onboarding is complete
- `POST /reset` - Reset onboarding

#### Permission Management
- `POST /permissions/request` - Request permission
- `POST /permissions/grant` - Grant permission
- `POST /permissions/deny` - Deny permission
- `GET /permissions` - Get user permissions

#### Tutorial Management
- `POST /tutorials/create` - Create feature tutorial
- `PUT /tutorials/progress` - Update tutorial progress
- `POST /tutorials/complete` - Complete tutorial
- `POST /tutorials/skip` - Skip tutorial
- `GET /tutorials` - Get user tutorials

#### Data Visualization
- `GET /charts` - Get data visualization charts
- `GET /trends` - Get trend analysis
- `GET /progress-tracking` - Get progress tracking

## Usage Examples

### Initialize Onboarding
```javascript
// Initialize onboarding for new user
const response = await fetch('/api/v1/onboarding/initialize', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
});

const { steps } = await response.json();
console.log('Onboarding steps:', steps);
```

### Complete Onboarding Step
```javascript
// Complete a step with data
await fetch('/api/v1/onboarding/complete-step', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    stepName: 'profile_setup',
    stepData: {
      firstName: 'John',
      lastName: 'Doe',
      timezone: 'UTC',
    },
  }),
});
```

### Request Permission
```javascript
// Request notification permission
await fetch('/api/v1/onboarding/permissions/request', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    permissionType: 'notifications',
    permissionName: 'Push Notifications',
    description: 'Receive reminders and insights about your mood, sleep, and goals',
    requestReason: 'To help you stay consistent with your wellness journey',
  }),
});
```

### Grant Permission
```javascript
// Grant permission after user approval
await fetch('/api/v1/onboarding/permissions/grant', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    permissionType: 'notifications',
  }),
});
```

### Create Tutorial
```javascript
// Create a feature tutorial
await fetch('/api/v1/onboarding/tutorials/create', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    featureName: 'mood',
    tutorialType: 'intro',
    title: 'Mood Tracking',
    description: 'Learn how to track your daily mood',
    content: {
      steps: [
        { title: 'Select Your Mood', description: 'Choose how you\'re feeling today' },
        { title: 'Add Context', description: 'Optionally add notes about what influenced your mood' },
        { title: 'View Patterns', description: 'See trends and patterns in your mood over time' },
      ],
    },
  }),
});
```

### Update Tutorial Progress
```javascript
// Update tutorial progress
await fetch('/api/v1/onboarding/tutorials/progress', {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({
    featureName: 'mood',
    progress: 50,
  }),
});
```

### Get Data Visualization Charts
```javascript
// Get mood trend chart
const chartResponse = await fetch('/api/v1/onboarding/charts?chartType=mood-trend&days=30', {
  headers: { 'Authorization': 'Bearer ' + token },
});

const { data } = await chartResponse.json();
console.log('Chart data:', data);
```

### Get Trend Analysis
```javascript
// Get mood trend analysis
const trendResponse = await fetch('/api/v1/onboarding/trends?metric=mood&days=7', {
  headers: { 'Authorization': 'Bearer ' + token },
});

const { trends } = await trendResponse.json();
console.log('Trend analysis:', trends);
```

### Get Progress Tracking
```javascript
// Get progress tracking data
const progressResponse = await fetch('/api/v1/onboarding/progress-tracking', {
  headers: { 'Authorization': 'Bearer ' + token },
});

const { progress } = await progressResponse.json();
console.log('Progress data:', progress);
```

## Onboarding Flow Steps

### Default Onboarding Steps

1. **Welcome** (`welcome`)
   - Welcome message and app overview
   - Feature highlights
   - Estimated time: 2 minutes

2. **Profile Setup** (`profile_setup`)
   - Complete user profile
   - Personal information
   - Estimated time: 5 minutes

3. **Permissions** (`permissions`)
   - Request necessary permissions
   - Explain permission benefits
   - Estimated time: 3 minutes

4. **Feature Introduction** (`feature_intro`)
   - Interactive feature tours
   - Tutorial walkthroughs
   - Estimated time: 10 minutes

5. **Goal Setting** (`goal_setting`)
   - Set personal goals
   - Define objectives
   - Estimated time: 5 minutes

6. **Preferences** (`preferences`)
   - Configure settings
   - Customize experience
   - Estimated time: 3 minutes

7. **Completion** (`completion`)
   - Onboarding complete
   - Next steps guidance
   - Estimated time: 1 minute

## Permission Types

### Available Permissions

- **notifications**: Push notifications for reminders and insights
- **location**: Location access for location-based features
- **camera**: Camera access for photo features
- **microphone**: Microphone access for voice features
- **calendar**: Calendar access for schedule integration
- **health**: Health data access for wellness insights
- **contacts**: Contacts access for social features
- **storage**: Storage access for data management

## Tutorial Types

### Tutorial Categories

- **intro**: Basic feature introduction
- **walkthrough**: Step-by-step feature walkthrough
- **tip**: Helpful tips and tricks
- **advanced**: Advanced feature usage

## Data Visualization Features

### Chart Types

1. **Mood Trend Chart** (`mood-trend`)
   - Line chart showing mood over time
   - Daily mood averages
   - Trend analysis

2. **Sleep Quality Chart** (`sleep-quality`)
   - Dual-axis chart with duration and quality
   - Sleep pattern visualization
   - Quality trends

3. **Mood Distribution Chart** (`mood-distribution`)
   - Pie chart showing mood categories
   - Mood distribution analysis
   - Color-coded categories

### Trend Analysis

- **Mood Trends**: Analyze mood patterns over time
- **Sleep Trends**: Track sleep quality improvements
- **Energy Trends**: Monitor energy level changes
- **Change Percentages**: Calculate percentage changes
- **Trend Direction**: Up, down, or stable trends

### Progress Tracking

- **Mood Progress**: Track mood improvement towards target
- **Sleep Progress**: Monitor sleep quality goals
- **Energy Progress**: Track energy level targets
- **Journal Streak**: Count consecutive journal entries
- **Visual Progress Bars**: Progress percentage displays

## Frontend Integration

### Onboarding Component Example

```javascript
// React component for onboarding
import React, { useState, useEffect } from 'react';

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(null);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    initializeOnboarding();
  }, []);

  const initializeOnboarding = async () => {
    const response = await fetch('/api/v1/onboarding/initialize', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const data = await response.json();
    setSteps(data.steps);
    setCurrentStep(data.steps[0]);
  };

  const completeStep = async (stepName, stepData) => {
    await fetch('/api/v1/onboarding/complete-step', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ stepName, stepData }),
    });
    
    // Move to next step
    const nextStep = steps.find(step => step.stepOrder === currentStep.stepOrder + 1);
    setCurrentStep(nextStep);
  };

  const skipStep = async (stepName) => {
    await fetch('/api/v1/onboarding/skip-step', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ stepName }),
    });
    
    // Move to next step
    const nextStep = steps.find(step => step.stepOrder === currentStep.stepOrder + 1);
    setCurrentStep(nextStep);
  };

  return (
    <div className="onboarding-container">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>
      
      {currentStep && (
        <div className="step-content">
          <h2>{currentStep.stepData.title}</h2>
          <p>{currentStep.stepData.description}</p>
          
          <div className="step-actions">
            <button onClick={() => completeStep(currentStep.stepName, {})}>
              Complete
            </button>
            <button onClick={() => skipStep(currentStep.stepName)}>
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Data Visualization Component Example

```javascript
// React component for data visualization
import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';

const DataVisualization = () => {
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('mood-trend');

  useEffect(() => {
    loadChartData();
  }, [chartType]);

  const loadChartData = async () => {
    const response = await fetch(`/api/v1/onboarding/charts?chartType=${chartType}&days=30`, {
      headers: { 'Authorization': 'Bearer ' + token },
    });
    const data = await response.json();
    setChartData(data.data);
  };

  const renderChart = () => {
    if (!chartData) return null;

    switch (chartType) {
      case 'mood-trend':
        return <Line data={chartData} options={{ responsive: true }} />;
      case 'sleep-quality':
        return <Line data={chartData} options={{ responsive: true }} />;
      case 'mood-distribution':
        return <Pie data={chartData} options={{ responsive: true }} />;
      default:
        return null;
    }
  };

  return (
    <div className="data-visualization">
      <div className="chart-controls">
        <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
          <option value="mood-trend">Mood Trend</option>
          <option value="sleep-quality">Sleep Quality</option>
          <option value="mood-distribution">Mood Distribution</option>
        </select>
      </div>
      
      <div className="chart-container">
        {renderChart()}
      </div>
    </div>
  );
};
```

## Best Practices

### Onboarding Flow
- **Progressive Disclosure**: Show information gradually
- **Clear Progress**: Always show progress indicators
- **Skip Options**: Allow users to skip non-essential steps
- **Contextual Help**: Provide help when needed
- **Mobile-First**: Design for mobile devices

### Permission Requests
- **Explain Benefits**: Always explain why permissions are needed
- **Timing**: Request permissions at the right moment
- **Respect Denials**: Don't repeatedly ask for denied permissions
- **Graceful Degradation**: App should work without permissions

### Data Visualization
- **Clear Labels**: Use clear, descriptive labels
- **Appropriate Charts**: Choose the right chart type for data
- **Color Coding**: Use consistent, accessible colors
- **Responsive Design**: Ensure charts work on all devices
- **Loading States**: Show loading indicators for data fetching

## Security Considerations

### Data Privacy
- **User Consent**: Ensure user consent for data collection
- **Data Minimization**: Only collect necessary data
- **Secure Storage**: Encrypt sensitive data
- **Access Control**: Restrict access to user data

### API Security
- **Authentication**: All endpoints require valid authentication
- **Input Validation**: Validate all input data
- **Rate Limiting**: Implement rate limiting for API endpoints
- **Error Handling**: Don't expose sensitive information in errors

## Performance Optimization

### Database Optimization
- **Indexes**: Proper indexes on frequently queried columns
- **Query Optimization**: Optimize database queries
- **Connection Pooling**: Use connection pooling for database connections
- **Caching**: Cache frequently accessed data

### Frontend Optimization
- **Lazy Loading**: Load components and data as needed
- **Image Optimization**: Optimize images and assets
- **Bundle Splitting**: Split JavaScript bundles
- **CDN Usage**: Use CDN for static assets

## Monitoring and Analytics

### Key Metrics
- **Onboarding Completion Rate**: Percentage of users completing onboarding
- **Step Drop-off Rates**: Which steps users skip or abandon
- **Permission Grant Rates**: Percentage of users granting permissions
- **Tutorial Completion**: Tutorial completion rates
- **Chart Usage**: Which visualizations are most used

### Error Tracking
- **API Errors**: Track API endpoint errors
- **Frontend Errors**: Monitor frontend JavaScript errors
- **Performance Issues**: Track slow API responses
- **User Feedback**: Collect user feedback on onboarding experience

## Future Enhancements

### Planned Features
- **A/B Testing**: Test different onboarding flows
- **Personalization**: Personalized onboarding based on user type
- **Advanced Analytics**: More sophisticated analytics and insights
- **Interactive Tutorials**: More interactive tutorial experiences
- **Gamification**: Add gamification elements to onboarding

### Integration Opportunities
- **Third-party Analytics**: Integration with analytics platforms
- **User Feedback**: Built-in feedback collection
- **Social Features**: Social onboarding and sharing
- **AI Assistance**: AI-powered onboarding guidance
- **Voice Interface**: Voice-guided onboarding

## Troubleshooting

### Common Issues

1. **Onboarding Not Starting**: Check user authentication and initialization
2. **Steps Not Completing**: Verify step data and API responses
3. **Permission Issues**: Check permission request flow and user responses
4. **Chart Loading**: Verify data availability and chart configuration
5. **Progress Not Updating**: Check progress calculation logic

### Debug Commands
```bash
# Check onboarding status
curl -X GET http://localhost:3000/api/v1/onboarding/progress \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test chart generation
curl -X GET "http://localhost:3000/api/v1/onboarding/charts?chartType=mood-trend&days=7" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check permissions
curl -X GET http://localhost:3000/api/v1/onboarding/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Conclusion

The Onboarding Flow and Data Visualization system provides a comprehensive foundation for user engagement and data insights. With its flexible architecture, extensive API, and rich visualization capabilities, it enables a smooth user experience from first-time setup to advanced data analysis.

The system is designed to scale with the application and provides the foundation for advanced user experience features in the future.

