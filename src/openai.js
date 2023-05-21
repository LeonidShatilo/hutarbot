import { Configuration, OpenAIApi } from 'openai';
import { createReadStream } from 'fs';

import { errorLogger } from './errorLogger.js';

import { OPEN_AI_KEY } from './constants.js';

class OpenAI {
  constructor() {
    const configuration = new Configuration({
      apiKey: OPEN_AI_KEY,
    });

    this.openAI = new OpenAIApi(configuration);
  }

  async chat(messages, ctx) {
    try {
      const response = await this.openAI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      });

      return response.data.choices[0].message;
    } catch (error) {
      await errorLogger('openai.chat', error, ctx);
    }
  }

  async transcription(filepath, ctx) {
    try {
      const response = await this.openAI.createTranscription(createReadStream(filepath), 'whisper-1');

      return response.data.text;
    } catch (error) {
      await errorLogger('openai.transcription', error, ctx);
    }
  }
}

export const openAI = new OpenAI();
