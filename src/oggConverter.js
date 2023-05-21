import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { errorLogger } from './errorLogger.js';

import { removeFile } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path);
  }

  async convert(input, output, ctx) {
    try {
      const outputPath = resolve(dirname(input), `${output}.mp3`);

      return new Promise((resolve, reject) => {
        ffmpeg(input)
          .inputOption('-t 30')
          .output(outputPath)
          .on('end', () => {
            removeFile(input, ctx);
            resolve(outputPath);
          })
          .on('error', (err) => reject(err.message))
          .run();
      });
    } catch (error) {
      await errorLogger('oggConverter.convert', error, ctx);
    }
  }

  async create(url, filename, ctx) {
    try {
      const oggPath = resolve(__dirname, '../assets', `${filename}.ogg`);

      const response = await axios.get(url, { responseType: 'stream' });

      return new Promise((resolve) => {
        const stream = createWriteStream(oggPath);

        response.data.pipe(stream);
        stream.on('finish', () => resolve(oggPath));
      });
    } catch (error) {
      await errorLogger('oggConverter.create', error, ctx);
    }
  }
}

export const ogg = new OggConverter();
