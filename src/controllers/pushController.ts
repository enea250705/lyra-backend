import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import PushDevice from '../models/PushDevice';

export const registerPushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { expoPushToken, platform, deviceModel } = req.body;

    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const existing = await PushDevice.findOne({ where: { expoPushToken } });
    if (existing) {
      await existing.update({ userId, platform: platform || 'unknown', deviceModel, isActive: true });
      sendSuccess(res, { id: existing.id }, 'Push token updated');
      return;
    }

    const device = await PushDevice.create({ userId, expoPushToken, platform: platform || 'unknown', deviceModel });
    sendSuccess(res, { id: device.id }, 'Push token registered');
  } catch (error) {
    sendError(res, 'Failed to register push token', 500);
  }
};

export const unregisterPushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    const { id } = req.params;

    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const device = await PushDevice.findOne({ where: { id, userId } });
    if (!device) {
      sendError(res, 'Push device not found', 404);
      return;
    }
    await device.update({ isActive: false });
    sendSuccess(res, { id }, 'Push token unregistered');
  } catch (error) {
    sendError(res, 'Failed to unregister push token', 500);
  }
};


