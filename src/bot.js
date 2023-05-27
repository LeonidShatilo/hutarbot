import { Telegraf } from 'telegraf';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { italic } from 'telegraf/format';
import { message } from 'telegraf/filters';
import LocalSession from 'telegraf-session-local';

import { auth } from './auth.js';
import { errorLogger } from './errorLogger.js';
import { ogg } from './oggConverter.js';
import { openAI } from './openai.js';

import { removeFile } from './utils.js';

import { GPT_ROLES, TELEGRAM_TOKEN } from './constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const bot = new Telegraf(TELEGRAM_TOKEN);

const databasePath = resolve(__dirname, '../assets', 'database.json');
const localSession = new LocalSession({ database: databasePath });

bot.use(localSession.middleware());

bot.use(auth());

bot.telegram.setMyCommands([{ command: 'new', description: 'Новая тема' }]);

bot.command('start', async (ctx) => {
  ctx.session.messages = [];

  await ctx.reply(
    'Привет! Я – искусственный интеллект. Меня зовут OpenAI. Я создан для того, чтобы помогать людям в решении различных задач. Задайте мне любой вопрос и я постараюсь помочь вам!'
  );
});

bot.command('new', async (ctx) => {
  ctx.session.messages = [];

  await ctx.reply('Конечно, давайте начнём новую тему. Чем я могу вам помочь?');
});

bot.on(message('text'), async (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.messages = ctx.session.messages || [];

  try {
    ctx.session.messages.push({
      role: GPT_ROLES.USER,
      content: ctx.message.text,
    });

    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
    const response = await openAI.chat(ctx.session.messages, ctx);

    ctx.session.messages.push({
      role: GPT_ROLES.ASSISTANT,
      content: response?.content,
    });

    await ctx.reply(response?.content);
  } catch (error) {
    await errorLogger('main.message.text', error, ctx);
  }
});

bot.on(message('voice'), async (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.messages = ctx.session.messages || [];

  try {
    await ctx.telegram.sendChatAction(ctx.chat.id, 'upload_voice');

    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId, ctx);
    const mp3Path = await ogg.convert(oggPath, userId, ctx);
    const text = await openAI.transcription(mp3Path, ctx);

    if (text) {
      await ctx.reply(italic(`«${text}»`));

      ctx.session.messages.push({
        role: GPT_ROLES.USER,
        content: text,
      });
    }

    await ctx.telegram.sendChatAction(ctx.chat.id, 'typing');
    const response = await openAI.chat(ctx.session.messages, ctx);

    ctx.session.messages.push({
      role: GPT_ROLES.ASSISTANT,
      content: response?.content,
    });

    await ctx.reply(response?.content);
    await removeFile(mp3Path, ctx);
  } catch (error) {
    await errorLogger('main.message.voice', error, ctx);
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));