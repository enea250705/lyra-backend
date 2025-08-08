import { Expo, ExpoPushMessage, ExpoPushReceipt } from 'expo-server-sdk';
import PushDevice from '../models/PushDevice';
import logger from '../utils/logger';

const expo = new Expo();

export async function sendPushToUser(userId: string, payload: { title: string; body: string; data?: any }) {
  const devices = await PushDevice.findAll({ where: { userId, isActive: true } });
  const messages: ExpoPushMessage[] = devices
    .filter((d) => Expo.isExpoPushToken(d.expoPushToken))
    .map((d) => ({
      to: d.expoPushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
    }));

  if (messages.length === 0) {
    logger.info(`[pushService] No valid push tokens for user ${userId}`);
    return;
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: any[] = [];
  for (const chunk of chunks) {
    try {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...chunkTickets);
    } catch (error) {
      logger.error('[pushService] Error sending push chunk:', error);
    }
  }

  // Optionally handle receipts to deactivate invalid tokens
  // Skipping receipt-based deactivation for now; can be added later with ticket->receipt mapping if needed.
} 