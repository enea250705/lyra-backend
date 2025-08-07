import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import Joi from 'joi';
import { registerPushToken, unregisterPushToken } from '../controllers/pushController';

const router = Router();

const registerSchema = Joi.object({
  expoPushToken: Joi.string().min(10).required(),
  platform: Joi.string().valid('ios', 'android').required(),
  deviceModel: Joi.string().max(120).optional(),
});

router.post('/tokens', authenticate, validateBody(registerSchema), registerPushToken);
router.delete('/tokens/:id', authenticate, unregisterPushToken);

export default router; 