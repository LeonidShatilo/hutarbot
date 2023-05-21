import { unlink } from 'fs/promises';

import { errorLogger } from './errorLogger.js';

export async function removeFile(path, ctx) {
  try {
    await unlink(path);
  } catch (error) {
    await errorLogger('utils.removeFile', error, ctx);
  }
}
