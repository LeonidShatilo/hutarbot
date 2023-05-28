import dotenv from 'dotenv';

dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN ?? '';
export const OPEN_AI_KEY = process.env.OPEN_AI_KEY ?? '';
export const ALLOWED_USER_IDS = process.env.ALLOWED_USER_IDS?.split(',').map((id) => Number(id)) ?? [];
export const ERROR_LOG_VIEWERS_USER_IDS =
  process.env.ERROR_LOG_VIEWERS_USER_IDS?.split(',').map((id) => Number(id)) ?? [];
export const WEBHOOK_URL = process.env.WEBHOOK_URL ?? '';
export const PORT = process.env.PORT ?? 3000;
export const DATABASE_NAME = process.env.DATABASE_NAME ?? '';
export const PING_INTERVAL_MS = Number(process.env.PING_INTERVAL_MS) ?? 900_000; // 15 min by default

export const GPT_ROLES = {
  ASSISTANT: 'assistant',
  USER: 'user',
  SYSTEM: 'system',
};

export const DEFAULT_ERROR_MESSAGE =
  'Ой, что-то пошло не так! Извините, я не могу сейчас помочь вам. Попробуйте позже.';
