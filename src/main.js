import { Telegraf } from 'telegraf';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { italic } from 'telegraf/format';
import { message } from 'telegraf/filters';
import LocalSession from 'telegraf-session-local';

import { ALLOWED_USER_IDS, ERROR_MESSAGE, GPT_ROLES, TELEGRAM_TOKEN } from './constants.js';
import { auth } from './auth.js';
import { ogg } from './oggConverter.js';
import { openAI } from './openai.js';
import { removeFile } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const bot = new Telegraf(TELEGRAM_TOKEN);

const databasePath = resolve(__dirname, '../assets', 'database.json');
const localSession = new LocalSession({ database: databasePath });

bot.use(localSession.middleware());

bot.telegram.setMyCommands([
  { command: 'new', description: 'Новая тема' },
  { command: 'abilities', description: 'Возможности' },
  { command: 'examples', description: 'Примеры запросов' },
]);

bot.command('start', auth(ALLOWED_USER_IDS), async (ctx) => {
  ctx.session.messages = [];

  await ctx.reply(
    'Привет! Я – искусственный интеллект. Меня зовут OpenAI. Я создан для того, чтобы помогать людям в решении различных задач. Задайте мне любой вопрос и я постараюсь помочь вам!'
  );
});

bot.command('new', auth(ALLOWED_USER_IDS), async (ctx) => {
  ctx.session.messages = [];

  await ctx.reply('Конечно, давайте начнём новую тему. Чем я могу вам помочь?');
});

bot.command('examples', auth(ALLOWED_USER_IDS), async (ctx) => {
  const message = {
    reply_markup: {
      keyboard: [
        [{ text: 'Объясни кратко и понятно для пятилетнего ребёнка, что такое чёрные дыры.' }],
        [{ text: 'Сформулируй ответ на вопрос: что такое искусственный интеллект и как он может изменить мир?' }],
        [{ text: 'Напиши короткий текст, описывающий пейзаж в горах, словно ты автор художественной книги.' }],
      ],
      resize_keyboard: false,
    },
    text: `Вы можете выбрать один из примеров:`,
  };

  await ctx.telegram.sendMessage(ctx.chat.id, message);
});

bot.command('abilities', auth(ALLOWED_USER_IDS), async (ctx) => {
  const message = {
    text: `Как модель искусственного интеллекта, мои возможности включают в себя:

1. Генерация текстов на различные темы и на разных языках.
2. Предоставление ответов и советов в различных областях знаний, таких как наука, искусство, технологии и многие другие.
3. Анализ текстов и классификация на основе заданных критериев.
4. Генерация текста для написания статей, писем, эссе, рассказов и многого другого.
5. Перевод текстов с одного языка на другой с высокой точностью и эффективностью.
6. Понимание и запоминание контекста во время диалога. Я учитываю не только отдельные слова, но и их последовательность в предложении и контекст в целом.
`,
  };

  try {
    await ctx.telegram.sendMessage(ctx.chat.id, message);

    ctx.session.messages.push({
      role: GPT_ROLES.ASSISTANT,
      content: message.text,
    });
  } catch (e) {
    await ctx.reply(ERROR_MESSAGE);
    console.error('Error when executing abilities command: ', e.message);
  }
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
