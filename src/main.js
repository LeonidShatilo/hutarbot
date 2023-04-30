import { Telegraf, session } from 'telegraf';
import { italic } from 'telegraf/format';
import { message } from 'telegraf/filters';

import { ERROR_MESSAGE, GPT_ROLES, TELEGRAM_TOKEN } from './constants.js';
import { ogg } from './oggConverter.js';
import { openAI } from './openai.js';

const bot = new Telegraf(TELEGRAM_TOKEN);

bot.use(session());

bot.command('start', async (ctx) => {
  ctx.session = {
    messages: [],
  };

  await ctx.reply(
    'Привет! Я – искусственный интеллект. Меня зовут OpenAI. Я создан для того, чтобы помогать людям в решении различных задач. Задай мне любой вопрос и я постараюсь помочь тебе!'
  );
});

bot.command('new', async (ctx) => {
  ctx.session = {
    messages: [],
  };

  await ctx.reply('Конечно, давайте начнём всё с чистого листа. Чем я могу вам помочь?');
});

bot.on(message('text'), async (ctx) => {
  ctx.session ??= {
    messages: [],
  };

  try {
    ctx.session.messages.push({ role: GPT_ROLES.USER, content: ctx.message.text });

    const response = await openAI.chat(ctx.session.messages);

    ctx.session.messages.push({ role: GPT_ROLES.ASSISTANT, content: response.content });

    await ctx.reply(response.content);
  } catch (e) {
    await ctx.reply(ERROR_MESSAGE);
    console.error('Error while processing a text message: ', e.message);
  }
});

bot.on(message('voice'), async (ctx) => {
  ctx.session ??= {
    messages: [],
  };

  try {
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.convert(oggPath, userId);
    const text = await openAI.transcription(mp3Path);

    await ctx.reply(italic(`«${text}»`));

    ctx.session.messages.push({ role: GPT_ROLES.USER, content: text });

    const response = await openAI.chat(ctx.session.messages);

    ctx.session.messages.push({ role: GPT_ROLES.ASSISTANT, content: response.content });

    await ctx.reply(response.content);
  } catch (e) {
    await ctx.reply(ERROR_MESSAGE);
    console.error('Error while processing a voice message: ', e.message);
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
