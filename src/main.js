import { Telegraf } from 'telegraf';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { italic } from 'telegraf/format';
import { message } from 'telegraf/filters';
import LocalSession from 'telegraf-session-local';

import { ALLOWED_USER_IDS, ERROR_MESSAGE, GPT_ROLES, TELEGRAM_TOKEN } from './constants.js';
import { auth } from './auth.js';
import { greeting } from './greeting.js';
import { ogg } from './oggConverter.js';
import { openAI } from './openai.js';
import { removeFile } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const bot = new Telegraf(TELEGRAM_TOKEN);

const databasePath = resolve(__dirname, '../assets', 'database.json');
const localSession = new LocalSession({ database: databasePath });

bot.use(localSession.middleware());

bot.command('start', auth(ALLOWED_USER_IDS), async (ctx) => {
  ctx.session.messages = [];

  await greeting()(ctx);
});

bot.command('new', auth(ALLOWED_USER_IDS), async (ctx) => {
  ctx.session.messages = [];

  await ctx.reply('Конечно, давайте начнём всё с чистого листа. Чем я могу вам помочь?');
});

bot.on(message('text'), auth(ALLOWED_USER_IDS), async (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.messages = ctx.session.messages || [];

  try {
    ctx.session.messages.push({
      role: GPT_ROLES.USER,
      content: ctx.message.text,
    });

    const response = await openAI.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: GPT_ROLES.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
  } catch (e) {
    await ctx.reply(ERROR_MESSAGE);
    console.error('Error while processing a text message: ', e.message);
  }
});

bot.on(message('voice'), auth(ALLOWED_USER_IDS), async (ctx) => {
  ctx.session = ctx.session || {};
  ctx.session.messages = ctx.session.messages || [];

  try {
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.convert(oggPath, userId);
    const text = await openAI.transcription(mp3Path);

    await ctx.reply(italic(`«${text}»`));

    ctx.session.messages.push({
      role: GPT_ROLES.USER,
      content: text,
    });

    const response = await openAI.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: GPT_ROLES.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);
    await removeFile(mp3Path);
  } catch (e) {
    await ctx.reply(ERROR_MESSAGE);
    console.error('Error while processing a voice message: ', e.message);
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
