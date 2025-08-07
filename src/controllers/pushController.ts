import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import PushDevice from '../models/PushDevice';

export const registerPushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { expoPushToken, platform, deviceModel } = req.body || {};

    if (!expoPushToken || !platform) {
      sendError(res, 'expoPushToken and platform are required', 400);
      return;
    }

    // Upsert by (userId, expoPushToken)
    const [device, created] = await PushDevice.findOrCreate({
      where: { userId, expoPushToken },
      defaults: { userId, expoPushToken, platform, deviceModel: deviceModel || null, isActive: true },
    });

    if (!created) {
      await device.update({ platform, deviceModel: deviceModel || device.deviceModel, isActive: true, lastSeen: new Date() });
    }

    sendSuccess(res, {
      id: device.id,
      expoPushToken: device.expoPushToken,
      platform: device.platform,
      deviceModel: device.deviceModel,
      isActive: device.isActive,
      lastSeen: device.lastSeen,
    }, 'Push token registered');
  } catch (error) {
    console.error('registerPushToken error:', error);
    sendError(res, 'Internal server error', 500);
  }
};

export const unregisterPushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user!.id;
    const { id } = req.params;

    const device = await PushDevice.findOne({ where: { id, userId } });
    if (!device) {
      sendError(res, 'Device not found', 404);
      return;
    }

    await device.update({ isActive: false });

    sendSuccess(res, { id: device.id }, 'Push token unregistered');
  } catch (error) {
    console.error('unregisterPushToken error:', error);
    sendError(res, 'Internal server error', 500);
  }
}; 