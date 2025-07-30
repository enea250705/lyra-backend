import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { config } from '../config';
import logger from '../utils/logger';
import User from '../models/User';
import MoodEntry from '../models/MoodEntry';
import Subscription from '../models/Subscription';
import { Op } from 'sequelize';

interface WeeklyReportData {
  user: User;
  moodAverage: number;
  moodTrend: string;
  topMoods: string[];
  insights: string[];
  recommendations: string[];
}

class EmailReportsService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Schedule weekly reports for every Sunday at 10 AM
    this.scheduleWeeklyReports();
  }

  private scheduleWeeklyReports() {
    cron.schedule('0 10 * * 0', async () => {
      logger.info('Starting weekly email reports generation');
      await this.sendWeeklyReportsToAllUsers();
    });
  }

  private async sendWeeklyReportsToAllUsers() {
    try {
      const users = await User.findAll({
        include: [
          {
            model: Subscription,
            where: {
              status: 'active',
            },
          },
        ],
      });

      for (const user of users) {
        try {
          await this.generateAndSendWeeklyReport(user);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
        } catch (error) {
          logger.error(`Failed to send weekly report to user ${user.id}:`, error);
        }
      }

      logger.info(`Weekly reports sent to ${users.length} users`);
    } catch (error) {
      logger.error('Error sending weekly reports:', error);
    }
  }

  private async generateAndSendWeeklyReport(user: User) {
    const reportData = await this.generateWeeklyReportData(user);
    
    if (reportData) {
      const emailHtml = this.generateWeeklyReportHTML(reportData);
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `Your Weekly Lyra Report - ${new Date().toLocaleDateString()}`,
        html: emailHtml,
      });

      logger.info(`Weekly report sent to ${user.email}`);
    }
  }

  private async generateWeeklyReportData(user: User): Promise<WeeklyReportData | null> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const moodEntries = await MoodEntry.findAll({
        where: {
          userId: user.id,
          createdAt: {
            [Op.gte]: oneWeekAgo,
          },
        },
        order: [['createdAt', 'DESC']],
      });

      if (moodEntries.length === 0) {
        return null;
      }

      const moodValues = moodEntries.map(entry => entry.moodValue);
      const moodAverage = moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length;

      // Calculate trend
      const firstHalf = moodValues.slice(0, Math.floor(moodValues.length / 2));
      const secondHalf = moodValues.slice(Math.floor(moodValues.length / 2));
      const firstHalfAvg = firstHalf.reduce((sum, value) => sum + value, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, value) => sum + value, 0) / secondHalf.length;
      
      let moodTrend = 'stable';
      if (secondHalfAvg > firstHalfAvg + 0.5) {
        moodTrend = 'improving';
      } else if (secondHalfAvg < firstHalfAvg - 0.5) {
        moodTrend = 'declining';
      }

      // Get top moods
      const moodCategories = moodEntries
        .filter(entry => entry.moodCategory)
        .map(entry => entry.moodCategory);
      
      const moodCounts = moodCategories.reduce((counts, category) => {
        if (category) {
          counts[category] = (counts[category] || 0) + 1;
        }
        return counts;
      }, {} as Record<string, number>);

      const topMoods = Object.entries(moodCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // Generate insights
      const insights = this.generateInsights(moodAverage, moodTrend, moodEntries.length);
      const recommendations = this.generateRecommendations(moodAverage, moodTrend);

      return {
        user,
        moodAverage,
        moodTrend,
        topMoods,
        insights,
        recommendations,
      };
    } catch (error) {
      logger.error('Error generating weekly report data:', error);
      return null;
    }
  }

  private generateInsights(moodAverage: number, moodTrend: string, entryCount: number): string[] {
    const insights = [];

    if (moodAverage >= 7) {
      insights.push('You had a great week with high mood levels!');
    } else if (moodAverage >= 5) {
      insights.push('Your mood was generally positive this week.');
    } else {
      insights.push('Your mood was lower than usual this week.');
    }

    if (moodTrend === 'improving') {
      insights.push('Great news! Your mood has been improving throughout the week.');
    } else if (moodTrend === 'declining') {
      insights.push('Your mood has been declining. Consider what might be affecting you.');
    } else {
      insights.push('Your mood has been stable this week.');
    }

    if (entryCount >= 5) {
      insights.push('Excellent job tracking your mood consistently!');
    } else if (entryCount >= 3) {
      insights.push('Good effort on mood tracking. Try to check in more regularly.');
    } else {
      insights.push('Remember to check in with your mood more frequently for better insights.');
    }

    return insights;
  }

  private generateRecommendations(moodAverage: number, moodTrend: string): string[] {
    const recommendations = [];

    if (moodAverage < 5) {
      recommendations.push('Consider talking to a friend or counselor about how you\'re feeling');
      recommendations.push('Try incorporating more physical activity into your routine');
      recommendations.push('Practice mindfulness or meditation for 10 minutes daily');
    } else if (moodAverage < 7) {
      recommendations.push('Keep up the good work! Try to maintain your positive habits');
      recommendations.push('Consider what activities made you feel best this week');
    } else {
      recommendations.push('Amazing week! Share your positivity with others');
      recommendations.push('Reflect on what contributed to your great mood');
    }

    if (moodTrend === 'declining') {
      recommendations.push('Pay attention to stress factors that might be affecting your mood');
      recommendations.push('Consider adjusting your sleep schedule or diet');
    } else if (moodTrend === 'improving') {
      recommendations.push('Keep doing what you\'re doing - it\'s working!');
    }

    return recommendations;
  }

  private generateWeeklyReportHTML(data: WeeklyReportData): string {
    const { user, moodAverage, moodTrend, topMoods, insights, recommendations } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0; }
          .metric { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .mood-score { font-size: 2em; font-weight: bold; color: #667eea; }
          .trend { font-size: 1.2em; margin: 10px 0; }
          .trend.improving { color: #28a745; }
          .trend.declining { color: #dc3545; }
          .trend.stable { color: #6c757d; }
          .list { margin: 15px 0; }
          .list li { margin: 8px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Weekly Lyra Report</h1>
            <p>Hello ${user.firstName || 'there'}! Here's your personal wellness summary.</p>
          </div>

          <div class="content">
            <div class="metric">
              <h3>Average Mood Score</h3>
              <div class="mood-score">${moodAverage.toFixed(1)}/10</div>
              <div class="trend ${moodTrend}">
                ${moodTrend === 'improving' ? '📈 Improving' : 
                  moodTrend === 'declining' ? '📉 Declining' : '➡️ Stable'}
              </div>
            </div>

            ${topMoods.length > 0 ? `
            <div class="metric">
              <h3>Top Mood Categories</h3>
              <ul class="list">
                ${topMoods.map(mood => `<li>${mood}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <div class="metric">
              <h3>Key Insights</h3>
              <ul class="list">
                ${insights.map(insight => `<li>${insight}</li>`).join('')}
              </ul>
            </div>

            <div class="metric">
              <h3>Recommendations</h3>
              <ul class="list">
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>Keep up the great work! 🌟</p>
            <p>
              <a href="${process.env.FRONTEND_URL}" style="color: #667eea;">Open Lyra App</a> | 
              <a href="${process.env.FRONTEND_URL}/settings" style="color: #667eea;">Manage Preferences</a>
            </p>
            <p><small>© 2025 Lyra AI. All rights reserved.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Manual trigger for testing
  async sendTestReport(userId: string) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await this.generateAndSendWeeklyReport(user);
      logger.info(`Test report sent to user ${userId}`);
    } catch (error) {
      logger.error('Error sending test report:', error);
      throw error;
    }
  }
}

export default new EmailReportsService();