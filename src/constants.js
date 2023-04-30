import dotenv from 'dotenv';

dotenv.config();

export const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
export const OPEN_AI_KEY = process.env.OPEN_AI_KEY;

export const GPT_ROLES = {
  ASSISTANT: 'assistant',
  USER: 'user',
  SYSTEM: 'system',
};

export const ERROR_MESSAGE = 'Ой, что-то пошло не так! Извините, я не могу сейчас помочь вам. Попробуйте позже.';
