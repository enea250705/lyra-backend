#!/usr/bin/env node

import { Command } from 'commander';
import AnalyticsService from '../services/analyticsService';
import DataVisualizationService from '../services/dataVisualizationService';
import logger from '../utils/logger';

const program = new Command();

program
  .name('analytics-cli')
  .description('Analytics and reporting CLI tools')
  .version('1.0.0');

// Generate analytics report
program
  .command('generate-report')
  .description('Generate analytics report')
  .requiredOption('-t, --type <type>', 'Report type (user_summary, feature_usage, behavior_analysis, retention, conversion, engagement)')
  .option('-u, --userId <userId>', 'User ID (optional for global reports)')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .option('-s, --start <start>', 'Start date (YYYY-MM-DD)')
  .option('-e, --end <end>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      const dateRange = options.start && options.end ? {
        start: new Date(options.start),
        end: new Date(options.end),
      } : undefined;

      const report = await AnalyticsService.generateReport(
        options.type,
        options.userId,
        dateRange,
        { days: parseInt(options.days) }
      );

      console.log('📊 Analytics Report Generated:');
      console.log('================================');
      console.log(`Report ID: ${report.id}`);
      console.log(`Type: ${report.reportType}`);
      console.log(`Name: ${report.reportName}`);
      console.log(`Date Range: ${report.dateRange.start.toDateString()} - ${report.dateRange.end.toDateString()}`);
      console.log(`Generated At: ${report.generatedAt.toISOString()}`);
      console.log('\n📈 Report Data:');
      console.log(JSON.stringify(report.reportData, null, 2));
    } catch (error) {
      logger.error('Error generating report:', error);
      process.exit(1);
    }
  });

// Get user engagement metrics
program
  .command('engagement')
  .description('Get user engagement metrics')
  .requiredOption('-u, --userId <userId>', 'User ID')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .action(async (options) => {
    try {
      const engagement = await AnalyticsService.getUserEngagementMetrics(
        options.userId,
        parseInt(options.days)
      );

      console.log('📊 User Engagement Metrics:');
      console.log('============================');
      console.log(`User ID: ${options.userId}`);
      console.log(`Period: Last ${options.days} days`);
      console.log(`Total Sessions: ${engagement.totalSessions}`);
      console.log(`Average Session Duration: ${engagement.averageSessionDuration} minutes`);
      console.log(`Pages Per Session: ${engagement.pagesPerSession}`);
      console.log(`Bounce Rate: ${engagement.bounceRate}%`);
      console.log(`Return User Rate: ${engagement.returnUserRate}%`);
      console.log(`Feature Adoption Rate: ${engagement.featureAdoptionRate}%`);
    } catch (error) {
      logger.error('Error getting engagement metrics:', error);
      process.exit(1);
    }
  });

// Get feature usage metrics
program
  .command('feature-usage')
  .description('Get feature usage metrics')
  .option('-f, --feature <feature>', 'Specific feature name')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .action(async (options) => {
    try {
      const metrics = await AnalyticsService.getFeatureUsageMetrics(
        options.feature,
        parseInt(options.days)
      );

      console.log('📊 Feature Usage Metrics:');
      console.log('=========================');
      console.log(`Period: Last ${options.days} days`);
      if (options.feature) {
        console.log(`Feature: ${options.feature}`);
      }
      console.log('\n📈 Metrics:');
      
      metrics.forEach(metric => {
        console.log(`\n${metric.eventType.toUpperCase()}:`);
        console.log(`  Total Users: ${metric.totalUsers}`);
        console.log(`  Active Users: ${metric.activeUsers}`);
        console.log(`  Usage Count: ${metric.usageCount}`);
        console.log(`  Avg Usage/User: ${metric.averageUsagePerUser}`);
        console.log(`  Retention Rate: ${metric.retentionRate}%`);
        console.log(`  Last Used: ${metric.lastUsed.toISOString()}`);
      });
    } catch (error) {
      logger.error('Error getting feature usage metrics:', error);
      process.exit(1);
    }
  });

// Get behavior insights
program
  .command('behavior-insights')
  .description('Get behavior insights')
  .option('-u, --userId <userId>', 'User ID (optional for global insights)')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .action(async (options) => {
    try {
      const insights = await AnalyticsService.getBehaviorInsights(
        options.userId,
        parseInt(options.days)
      );

      console.log('📊 Behavior Insights:');
      console.log('=====================');
      console.log(`Period: Last ${options.days} days`);
      if (options.userId) {
        console.log(`User ID: ${options.userId}`);
      }

      console.log('\n🌐 Most Visited Pages:');
      insights.mostVisitedPages.forEach((page, index) => {
        console.log(`  ${index + 1}. ${page.page} (${page.visits} visits, ${page.avgTimeOnPage}s avg)`);
      });

      console.log('\n🖱️ Top Clicked Elements:');
      insights.topClickedElements.forEach((element, index) => {
        console.log(`  ${index + 1}. ${element.element} (${element.clicks} clicks, ${element.type})`);
      });

      console.log('\n🛤️ User Journey:');
      insights.userJourney.forEach((step, index) => {
        console.log(`  ${step.step}. ${step.page} (${step.users} users, ${step.dropoffRate.toFixed(1)}% dropoff)`);
      });

      console.log('\n📜 Scroll Behavior:');
      console.log(`  Average Scroll Depth: ${insights.scrollBehavior.averageScrollDepth}%`);
      console.log('  Scroll Depth Distribution:');
      insights.scrollBehavior.scrollDepthDistribution.forEach(dist => {
        console.log(`    ${dist.range}: ${dist.percentage}%`);
      });
    } catch (error) {
      logger.error('Error getting behavior insights:', error);
      process.exit(1);
    }
  });

// Generate dashboard
program
  .command('dashboard')
  .description('Generate analytics dashboard')
  .option('-u, --userId <userId>', 'User ID (optional for global dashboard)')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .option('-o, --output <file>', 'Output file for dashboard JSON')
  .action(async (options) => {
    try {
      const dashboard = await DataVisualizationService.generateDashboard(
        options.userId,
        options.days
      );

      console.log('📊 Analytics Dashboard Generated:');
      console.log('=================================');
      console.log(`Dashboard ID: ${dashboard.id}`);
      console.log(`Name: ${dashboard.name}`);
      console.log(`Description: ${dashboard.description}`);
      console.log(`Widgets: ${dashboard.widgets.length}`);
      console.log(`Date Range: ${dashboard.filters.dateRange.start.toDateString()} - ${dashboard.filters.dateRange.end.toDateString()}`);
      console.log(`Public: ${dashboard.isPublic}`);

      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, JSON.stringify(dashboard, null, 2));
        console.log(`\nDashboard saved to: ${options.output}`);
      } else {
        console.log('\n📈 Widgets:');
        dashboard.widgets.forEach((widget, index) => {
          console.log(`  ${index + 1}. ${widget.title} (${widget.type}, ${widget.size})`);
        });
      }
    } catch (error) {
      logger.error('Error generating dashboard:', error);
      process.exit(1);
    }
  });

// Generate chart data
program
  .command('chart')
  .description('Generate chart data')
  .requiredOption('-t, --type <type>', 'Chart type (line, bar, pie, area, scatter, doughnut, radar)')
  .requiredOption('-m, --metric <metric>', 'Metric (usage, engagement, retention, conversion, behavior)')
  .option('-u, --userId <userId>', 'User ID')
  .option('-d, --days <days>', 'Number of days to analyze', '30')
  .option('-o, --output <file>', 'Output file for chart data')
  .action(async (options) => {
    try {
      const chartData = await DataVisualizationService.generateChartData(
        options.type,
        options.metric,
        options.userId,
        parseInt(options.days)
      );

      console.log('📊 Chart Data Generated:');
      console.log('=========================');
      console.log(`Chart Type: ${chartData.config.type}`);
      console.log(`Title: ${chartData.config.title}`);
      console.log(`Metric: ${options.metric}`);
      console.log(`Period: Last ${options.days} days`);
      if (options.userId) {
        console.log(`User ID: ${options.userId}`);
      }

      if (options.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(options.output, JSON.stringify(chartData, null, 2));
        console.log(`\nChart data saved to: ${options.output}`);
      } else {
        console.log('\n📈 Chart Configuration:');
        console.log(JSON.stringify(chartData.config, null, 2));
        console.log('\n📊 Sample Data (first 5 items):');
        if (chartData.data.labels) {
          console.log('Labels:', chartData.data.labels.slice(0, 5));
        }
        if (chartData.data.datasets && chartData.data.datasets[0]) {
          console.log('Data:', chartData.data.datasets[0].data.slice(0, 5));
        }
      }
    } catch (error) {
      logger.error('Error generating chart data:', error);
      process.exit(1);
    }
  });

// Track behavior event
program
  .command('track-behavior')
  .description('Track a behavior event')
  .requiredOption('-u, --userId <userId>', 'User ID')
  .requiredOption('-s, --sessionId <sessionId>', 'Session ID')
  .requiredOption('-t, --type <type>', 'Event type (page_view, click, scroll, focus, blur, form_submit, api_call)')
  .requiredOption('-n, --eventName <eventName>', 'Event name')
  .option('-m, --metadata <metadata>', 'Metadata JSON string')
  .action(async (options) => {
    try {
      const metadata = options.metadata ? JSON.parse(options.metadata) : undefined;

      await AnalyticsService.trackBehavior(
        options.userId,
        options.sessionId,
        options.type,
        options.eventName,
        metadata
      );

      console.log('✅ Behavior event tracked successfully:');
      console.log(`User ID: ${options.userId}`);
      console.log(`Session ID: ${options.sessionId}`);
      console.log(`Event Type: ${options.type}`);
      console.log(`Event Name: ${options.eventName}`);
      if (metadata) {
        console.log(`Metadata: ${JSON.stringify(metadata)}`);
      }
    } catch (error) {
      logger.error('Error tracking behavior event:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
