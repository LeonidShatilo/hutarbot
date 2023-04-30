import { Configuration, OpenAIApi } from 'openai';
import { createReadStream } from 'fs';

import { OPEN_AI_KEY } from './constants.js';

class OpenAI {
  constructor(apiKey) {
    const configuration = new Configuration({
      apiKey,
    });

    this.openAI = new OpenAIApi(configuration);
  }

  async chat(messages) {
    try {
      const response = await this.openAI.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      });

      return response.data.choices[0].message;
    } catch (e) {
      console.error('Error while getting a response from gpt chat: ', e.message);
    }
  }

  async transcription(filepath) {
    try {
      const response = await this.openAI.createTranscription(createReadStream(filepath), 'whisper-1');

      return response.data.text;
    } catch (e) {
      console.error('Error while transcription: ', e.message);
    }
  }
}

export const openAI = new OpenAI(OPEN_AI_KEY);
