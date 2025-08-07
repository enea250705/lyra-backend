import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushTicketReceipt } from 'expo-server-sdk';
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
  const tickets: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    try {
      const chunkTickets = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...chunkTickets);
    } catch (error) {
      logger.error('[pushService] Error sending push chunk:', error);
    }
  }

  // Optionally handle receipts to deactivate invalid tokens
  const receiptIds = tickets
    .map((t) => (t.status === 'ok' ? t.id : null))
    .filter((id): id is string => !!id);

  const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const [id, receipt] of Object.entries(receipts) as [string, ExpoPushTicketReceipt][]) {
        if (receipt.status === 'ok') continue;
        logger.warn(`[pushService] Push receipt error for id ${id}:`, receipt);
        if (receipt.details && (receipt.details as any).error === 'DeviceNotRegistered') {
          // Deactivate tokens that are no longer valid
          const invalidTokenTicket = tickets.find((t) => t.id === id);
          if (invalidTokenTicket) {
            const token = (invalidTokenTicket as any).to as string | undefined;
            if (token) {
              await PushDevice.update({ isActive: false }, { where: { expoPushToken: token } });
            }
          }
        }
      }
    } catch (error) {
      logger.error('[pushService] Error fetching push receipts:', error);
    }
  }
} 