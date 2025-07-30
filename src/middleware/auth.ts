import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';
import User from '../models/User';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      sendError(res, 'Access token required', 401);
      return;
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      sendError(res, 'User not found', 401);
      return;
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    sendError(res, 'Invalid token', 401);
  }
};

export const optional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    
    if (user) {
      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }

    next();
  } catch (error) {
    next();
  }
};