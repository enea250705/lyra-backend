import axios from 'axios';
import { config } from '../config';
import logger from '../utils/logger';

interface IOSReceiptData {
  receipt: string;
  productId: string;
  transactionId: string;
  platform: 'ios';
}

interface AndroidReceiptData {
  receipt: string;
  productId: string;
  transactionId: string;
  purchaseToken: string;
  packageName: string;
  platform: 'android';
}

type ReceiptData = IOSReceiptData | AndroidReceiptData;

interface ValidationResult {
  success: boolean;
  subscription?: {
    productId: string;
    purchaseDate: string;
    expirationDate: string;
    isActive: boolean;
    autoRenewing: boolean;
    originalTransactionId: string;
    environment: 'sandbox' | 'production';
  };
  error?: string;
}

class NativeReceiptService {
  /**
   * Validate receipt with Apple or Google
   */
  async validateReceipt(receiptData: ReceiptData): Promise<ValidationResult> {
    try {
      if (receiptData.platform === 'ios') {
        return await this.validateIOSReceipt(receiptData as IOSReceiptData);
      } else {
        return await this.validateAndroidReceipt(receiptData as AndroidReceiptData);
      }
    } catch (error) {
      logger.error('Receipt validation error:', error);
      return {
        success: false,
        error: 'Receipt validation failed',
      };
    }
  }

  /**
   * Validate iOS receipt with Apple
   */
  private async validateIOSReceipt(receiptData: IOSReceiptData): Promise<ValidationResult> {
    const { receipt } = receiptData;

    // Apple's receipt validation endpoints
    const productionUrl = 'https://buy.itunes.apple.com/verifyReceipt';
    const sandboxUrl = 'https://sandbox.itunes.apple.com/verifyReceipt';

    try {
      // Try production first
      let result = await this.callAppleAPI(productionUrl, receipt);
      
      // If production fails with sandbox receipt, try sandbox
      if (result.status === 21007) {
        logger.info('Production receipt validation failed, trying sandbox...');
        result = await this.callAppleAPI(sandboxUrl, receipt);
      }

      if (result.status === 0) {
        // Success - parse the receipt
        const latestReceiptInfo = result.latest_receipt_info?.[0] || result.receipt?.in_app?.[0];
        
        if (!latestReceiptInfo) {
          return {
            success: false,
            error: 'No subscription information found in receipt',
          };
        }

        const expirationDate = new Date(parseInt(latestReceiptInfo.expires_date_ms));
        const purchaseDate = new Date(parseInt(latestReceiptInfo.purchase_date_ms));
        const isActive = expirationDate > new Date();

        return {
          success: true,
          subscription: {
            productId: latestReceiptInfo.product_id,
            purchaseDate: purchaseDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
            isActive,
            autoRenewing: latestReceiptInfo.auto_renew_status === '1',
            originalTransactionId: latestReceiptInfo.original_transaction_id,
            environment: result.environment,
          },
        };
      } else {
        logger.error('Apple receipt validation failed:', result);
        return {
          success: false,
          error: `Apple validation failed: ${result.status}`,
        };
      }
    } catch (error) {
      logger.error('iOS receipt validation error:', error);
      return {
        success: false,
        error: 'iOS receipt validation failed',
      };
    }
  }

  /**
   * Call Apple's receipt validation API
   */
  private async callAppleAPI(url: string, receipt: string): Promise<any> {
    const response = await axios.post(url, {
      'receipt-data': receipt,
      password: process.env.APPLE_SHARED_SECRET, // You'll need to set this
      'exclude-old-transactions': true,
    }, {
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Validate Android receipt with Google Play
   */
  private async validateAndroidReceipt(receiptData: AndroidReceiptData): Promise<ValidationResult> {
    const { purchaseToken, packageName, productId } = receiptData;

    try {
      // For Android, you need Google Play Developer API
      // This requires OAuth2 service account authentication
      const accessToken = await this.getGooglePlayAccessToken();
      
      if (!accessToken) {
        return {
          success: false,
          error: 'Failed to get Google Play access token',
        };
      }

      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: 10000,
      });

      const purchase = response.data as any;
      
      if (purchase) {
        const expirationDate = new Date(parseInt(purchase.expiryTimeMillis || '0'));
        const purchaseDate = new Date(parseInt(purchase.startTimeMillis || '0'));
        const isActive = expirationDate > new Date() && purchase.paymentState === 1;

        return {
          success: true,
          subscription: {
            productId: productId,
            purchaseDate: purchaseDate.toISOString(),
            expirationDate: expirationDate.toISOString(),
            isActive,
            autoRenewing: purchase.autoRenewing || false,
            originalTransactionId: purchase.orderId || '',
            environment: 'production', // Google Play doesn't distinguish like Apple
          },
        };
      } else {
        return {
          success: false,
          error: 'Invalid purchase data from Google Play',
        };
      }
    } catch (error: any) {
      logger.error('Android receipt validation error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Android receipt validation failed',
      };
    }
  }

  /**
   * Get Google Play access token (simplified version)
   * In production, you'd use a proper OAuth2 flow with service account
   */
  private async getGooglePlayAccessToken(): Promise<string | null> {
    try {
      // This is a simplified version - you'll need to implement proper OAuth2
      // with Google Service Account for production
      
      // For now, return null to indicate this needs proper implementation
      logger.warn('Google Play receipt validation requires OAuth2 service account setup');
      return null;
      
      /*
      // Proper implementation would look like this:
      const jwt = await this.createGoogleServiceAccountJWT();
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      });
      
      return response.data.access_token;
      */
    } catch (error) {
      logger.error('Failed to get Google Play access token:', error);
      return null;
    }
  }

  /**
   * Mock validation for development (when you don't have Apple/Google setup yet)
   */
  async mockValidateReceipt(receiptData: ReceiptData): Promise<ValidationResult> {
    logger.info('Using mock receipt validation for development');
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful validation
    const now = new Date();
    const expirationDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    return {
      success: true,
      subscription: {
        productId: receiptData.productId,
        purchaseDate: now.toISOString(),
        expirationDate: expirationDate.toISOString(),
        isActive: true,
        autoRenewing: true,
        originalTransactionId: receiptData.transactionId,
        environment: 'sandbox',
      },
    };
  }

  /**
   * Determine subscription plan from product ID
   */
  getSubscriptionPlan(productId: string): 'pro' | 'premium' | null {
    if (productId.includes('pro')) {
      return 'pro';
    } else if (productId.includes('premium')) {
      return 'premium';
    }
    return null;
  }
}

export default new NativeReceiptService();