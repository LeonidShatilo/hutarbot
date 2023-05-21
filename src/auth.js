import { ALLOWED_USER_IDS } from './constants.js';

export const auth = () => async (ctx, next) => {
  const userId = ctx.from?.id;

  if (userId && ALLOWED_USER_IDS.includes(userId)) {
    return next();
  }

  await ctx.reply('Извините, это приватный бот — вы не можете им пользоваться.');

  return;
};
