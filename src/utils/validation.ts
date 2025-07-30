import Joi from 'joi';

export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  
  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};

export const moodSchemas = {
  create: Joi.object({
    moodValue: Joi.number().min(1).max(10).required(),
    moodCategory: Joi.string().max(50).optional(),
    notes: Joi.string().max(500).optional(),
  }),
};

export const energySchemas = {
  create: Joi.object({
    energyLevel: Joi.number().min(1).max(10).required(),
    energyEmoji: Joi.string().max(10).optional(),
    notes: Joi.string().max(500).optional(),
  }),
};

export const sleepSchemas = {
  create: Joi.object({
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    qualityRating: Joi.number().min(1).max(5).required(),
    notes: Joi.string().max(500).optional(),
  }),
};

export const focusSchemas = {
  start: Joi.object({
    goal: Joi.string().max(200).optional(),
  }),
  
  end: Joi.object({
    distractionCount: Joi.number().min(0).default(0),
    completed: Joi.boolean().default(false),
  }),
};

export const journalSchemas = {
  create: Joi.object({
    title: Joi.string().max(255).optional(),
    content: Joi.string().optional(),
    voiceUrl: Joi.string().uri().optional(),
    pinProtected: Joi.boolean().default(false),
  }),
  
  update: Joi.object({
    title: Joi.string().max(255).optional(),
    content: Joi.string().optional(),
    voiceUrl: Joi.string().uri().optional(),
    pinProtected: Joi.boolean().optional(),
  }),
};

export const checkinSchemas = {
  create: Joi.object({
    content: Joi.string().max(1000).optional(),
    moodEmoji: Joi.string().max(10).optional(),
    voiceTranscriptionUrl: Joi.string().uri().optional(),
  }),
};

export const transactionSchemas = {
  create: Joi.object({
    amount: Joi.number().required(),
    currency: Joi.string().length(3).default('EUR'),
    description: Joi.string().max(255).optional(),
    category: Joi.string().max(100).optional(),
    transactionDate: Joi.date().iso().required(),
    isDebit: Joi.boolean().required(),
  }),
};

export const settingsSchemas = {
  update: Joi.object({
    theme: Joi.string().valid('light', 'dark').optional(),
    aiTone: Joi.string().max(50).optional(),
    timezone: Joi.string().max(50).optional(),
    language: Joi.string().max(10).optional(),
    featuresEnabled: Joi.object().optional(),
  }),
};

export const notificationSettingsSchemas = {
  update: Joi.object({
    moodReminder: Joi.boolean().optional(),
    moodReminderTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    journalReminder: Joi.boolean().optional(),
    journalReminderTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    sleepReminder: Joi.boolean().optional(),
    sleepReminderTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    financeReminder: Joi.boolean().optional(),
    financeReminderFrequency: Joi.string().valid('daily', 'weekly', 'monthly').optional(),
  }),
};

export const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
});