import axios from 'axios';
import { unlink } from 'fs/promises';

import { errorLogger } from './errorLogger.js';

import { WEBHOOK_URL } from './constants.js';

export const removeFile = async (path, ctx) => {
  try {
    await unlink(path);
  } catch (error) {
    await errorLogger('utils.removeFile', error, ctx);
  }
};

export const pingWebhook = () => {
  axios.get(WEBHOOK_URL).catch((error) => {
    console.log(`Ping failed: ${error.message}`);
  });
};
