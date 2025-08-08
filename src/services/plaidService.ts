import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import logger from '../utils/logger';

interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: string;
}

interface PlaidLinkTokenRequest {
  userId: string;
  clientName: string;
}

interface PlaidTransactionData {
  accountId: string;
  amount: number;
  date: string;
  merchantName?: string;
  category: string[];
  subcategory?: string;
  transactionId: string;
}

interface PlaidAccountData {
  accountId: string;
  name: string;
  type: string;
  subtype: string;
  balance: {
    available?: number;
    current: number;
    currency: string;
  };
}

class PlaidService {
  private client: PlaidApi | null = null;

  constructor() {
    const config: PlaidConfig = {
      clientId: process.env.PLAID_CLIENT_ID!,
      secret: process.env.PLAID_SECRET_KEY!,
      environment: process.env.PLAID_ENVIRONMENT || 'sandbox',
    };

    if (!config.clientId || !config.secret) {
      // No credentials provided: keep client null and let callers handle gracefully
      this.client = null;
      logger.warn('Plaid disabled: missing PLAID_CLIENT_ID/PLAID_SECRET_KEY');
      return;
    }

    const configuration = new Configuration({
      basePath: this.getEnvironmentUrl(config.environment),
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': config.clientId,
          'PLAID-SECRET': config.secret,
        },
      },
    });

    this.client = new PlaidApi(configuration);
  }

  private getEnvironmentUrl(environment: string): string {
    switch (environment.toLowerCase()) {
      case 'sandbox':
        return PlaidEnvironments.sandbox;
      case 'development':
        return PlaidEnvironments.development;
      case 'production':
        return PlaidEnvironments.production;
      default:
        return PlaidEnvironments.sandbox;
    }
  }

  /**
   * Create a link token for Plaid Link initialization
   */
  async createLinkToken(request: PlaidLinkTokenRequest): Promise<string> {
    if (!this.client) throw new Error('Plaid is not configured on this server.');
    try {
      const response = await this.client.linkTokenCreate({
        user: {
          client_user_id: request.userId,
        },
        client_name: request.clientName,
        products: [Products.Transactions, Products.Auth, Products.Identity],
        country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb],
        language: 'en',
        webhook: process.env.PLAID_WEBHOOK_URL,
      });

      logger.info(`Created Plaid link token for user ${request.userId}`);
      return response.data.link_token;
    } catch (error: any) {
      logger.error('Error creating Plaid link token:', error);
      throw new Error(`Failed to create link token: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(publicToken: string): Promise<string> {
    if (!this.client) throw new Error('Plaid is not configured on this server.');
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      logger.info('Successfully exchanged public token for access token');
      return response.data.access_token;
    } catch (error: any) {
      logger.error('Error exchanging public token:', error);
      throw new Error(`Failed to exchange public token: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Get accounts for a user
   */
  async getAccounts(accessToken: string): Promise<PlaidAccountData[]> {
    if (!this.client) throw new Error('Plaid is not configured on this server.');
    try {
      const response = await this.client.accountsGet({
        access_token: accessToken,
      });

      const accounts: PlaidAccountData[] = response.data.accounts.map((account: any) => ({
        accountId: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype || '',
        balance: {
          available: account.balances.available || undefined,
          current: account.balances.current || 0,
          currency: account.balances.iso_currency_code || 'USD',
        },
      }));

      logger.info(`Retrieved ${accounts.length} accounts`);
      return accounts;
    } catch (error: any) {
      logger.error('Error getting accounts:', error);
      throw new Error(`Failed to get accounts: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Get transactions for a user within a date range
   */
  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string,
    accountIds?: string[]
  ): Promise<PlaidTransactionData[]> {
    if (!this.client) throw new Error('Plaid is not configured on this server.');
    try {
      const request = {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        account_ids: accountIds,
      };

      const response = await this.client.transactionsGet(request);

      const transactions: PlaidTransactionData[] = response.data.transactions.map((transaction: any) => ({
        accountId: transaction.account_id,
        amount: transaction.amount,
        date: transaction.date,
        merchantName: transaction.merchant_name || undefined,
        category: transaction.category || [],
        subcategory: transaction.category?.[1] || undefined,
        transactionId: transaction.transaction_id,
      }));

      logger.info(`Retrieved ${transactions.length} transactions`);
      return transactions;
    } catch (error: any) {
      logger.error('Error getting transactions:', error);
      throw new Error(`Failed to get transactions: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Get recent transactions (last 30 days)
   */
  async getRecentTransactions(accessToken: string, accountIds?: string[]): Promise<PlaidTransactionData[]> {
    if (!this.client) throw new Error('Plaid is not configured on this server.');
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return this.getTransactions(accessToken, startDate, endDate, accountIds);
    } catch (error: any) {
      logger.error('Error getting recent transactions:', error);
      throw new Error(`Failed to get recent transactions: ${error.response?.data?.error_message || error.message}`);
    }
  }

  /**
   * Analyze spending patterns from transactions
   */
  async analyzeSpendingPatterns(transactions: PlaidTransactionData[]): Promise<{
    totalSpent: number;
    averageTransaction: number;
    categoryBreakdown: Record<string, { amount: number; count: number }>;
    topMerchants: Array<{ merchant: string; amount: number; count: number }>;
    dailySpending: Record<string, number>;
  }> {
    try {
      // Filter out transfers and positive amounts (income)
      const spendingTransactions = transactions.filter(t => 
        t.amount > 0 && 
        !t.category.includes('Transfer') && 
        !t.category.includes('Deposit')
      );

      const totalSpent = spendingTransactions.reduce((sum, t) => sum + t.amount, 0);
      const averageTransaction = spendingTransactions.length > 0 ? totalSpent / spendingTransactions.length : 0;

      // Category breakdown
      const categoryBreakdown: Record<string, { amount: number; count: number }> = {};
      spendingTransactions.forEach(transaction => {
        const category = transaction.category[0] || 'Other';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { amount: 0, count: 0 };
        }
        categoryBreakdown[category].amount += transaction.amount;
        categoryBreakdown[category].count += 1;
      });

      // Top merchants
      const merchantMap: Record<string, { amount: number; count: number }> = {};
      spendingTransactions.forEach(transaction => {
        const merchant = transaction.merchantName || 'Unknown';
        if (!merchantMap[merchant]) {
          merchantMap[merchant] = { amount: 0, count: 0 };
        }
        merchantMap[merchant].amount += transaction.amount;
        merchantMap[merchant].count += 1;
      });

      const topMerchants = Object.entries(merchantMap)
        .map(([merchant, data]) => ({ merchant, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Daily spending
      const dailySpending: Record<string, number> = {};
      spendingTransactions.forEach(transaction => {
        const date = transaction.date;
        dailySpending[date] = (dailySpending[date] || 0) + transaction.amount;
      });

      return {
        totalSpent,
        averageTransaction,
        categoryBreakdown,
        topMerchants,
        dailySpending,
      };
    } catch (error) {
      logger.error('Error analyzing spending patterns:', error);
      throw error;
    }
  }

  /**
   * Identify potential savings opportunities
   */
  async identifySavingsOpportunities(transactions: PlaidTransactionData[]): Promise<{
    suggestions: Array<{
      type: string;
      description: string;
      potentialSavings: number;
      category: string;
      confidence: number;
    }>;
    subscriptionAnalysis: Array<{
      merchant: string;
      frequency: string;
      amount: number;
      lastCharge: string;
    }>;
  }> {
    try {
      const spendingTransactions = transactions.filter(t => t.amount > 0);
      const suggestions: Array<{
        type: string;
        description: string;
        potentialSavings: number;
        category: string;
        confidence: number;
      }> = [];

      // Identify recurring subscriptions
      const subscriptionKeywords = ['netflix', 'spotify', 'amazon', 'apple', 'google', 'subscription', 'monthly', 'annual'];
      const potentialSubscriptions: Record<string, PlaidTransactionData[]> = {};

      spendingTransactions.forEach(transaction => {
        const merchant = transaction.merchantName?.toLowerCase() || '';
        const isSubscription = subscriptionKeywords.some(keyword => merchant.includes(keyword)) ||
                              transaction.category.includes('Subscription') ||
                              transaction.category.includes('Software');

        if (isSubscription) {
          if (!potentialSubscriptions[merchant]) {
            potentialSubscriptions[merchant] = [];
          }
          potentialSubscriptions[merchant].push(transaction);
        }
      });

      // Analyze subscriptions
      const subscriptionAnalysis = Object.entries(potentialSubscriptions).map(([merchant, txns]) => {
        const sortedTxns = txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const averageAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
        
        // Determine frequency
        let frequency = 'unknown';
        if (txns.length >= 2) {
          const daysBetween = (new Date(sortedTxns[0].date).getTime() - new Date(sortedTxns[1].date).getTime()) / (1000 * 60 * 60 * 24);
          if (daysBetween >= 28 && daysBetween <= 32) frequency = 'monthly';
          else if (daysBetween >= 85 && daysBetween <= 95) frequency = 'quarterly';
          else if (daysBetween >= 360 && daysBetween <= 370) frequency = 'annual';
        }

        return {
          merchant,
          frequency,
          amount: averageAmount,
          lastCharge: sortedTxns[0].date,
        };
      });

      // Generate savings suggestions
      // 1. Subscription optimization
      subscriptionAnalysis.forEach(sub => {
        if (sub.amount > 10) {
          suggestions.push({
            type: 'subscription_review',
            description: `Review ${sub.merchant} subscription (${sub.frequency}, $${sub.amount.toFixed(2)})`,
            potentialSavings: sub.amount,
            category: 'Subscriptions',
            confidence: 0.8,
          });
        }
      });

      // 2. High-frequency merchant spending
      const merchantSpending: Record<string, { total: number; count: number }> = {};
      spendingTransactions.forEach(t => {
        const merchant = t.merchantName || 'Unknown';
        if (!merchantSpending[merchant]) {
          merchantSpending[merchant] = { total: 0, count: 0 };
        }
        merchantSpending[merchant].total += t.amount;
        merchantSpending[merchant].count += 1;
      });

      Object.entries(merchantSpending).forEach(([merchant, data]) => {
        if (data.count >= 5 && data.total > 100) {
          const avgTransaction = data.total / data.count;
          suggestions.push({
            type: 'frequent_spending',
            description: `High frequency spending at ${merchant} (${data.count} transactions, avg $${avgTransaction.toFixed(2)})`,
            potentialSavings: data.total * 0.2, // Assume 20% potential savings
            category: 'Frequent Purchases',
            confidence: 0.6,
          });
        }
      });

      return {
        suggestions,
        subscriptionAnalysis,
      };
    } catch (error) {
      logger.error('Error identifying savings opportunities:', error);
      throw error;
    }
  }

  /**
   * Remove item (disconnect bank account)
   */
  async removeItem(accessToken: string): Promise<void> {
    if (!this.client) throw new Error('Plaid is not configured on this server.');
    try {
      await this.client.itemRemove({
        access_token: accessToken,
      });

      logger.info('Successfully removed Plaid item');
    } catch (error: any) {
      logger.error('Error removing Plaid item:', error);
      throw new Error(`Failed to remove item: ${error.response?.data?.error_message || error.message}`);
    }
  }
}

export default new PlaidService();
export { PlaidTransactionData, PlaidAccountData, PlaidLinkTokenRequest };