export const auth = (allowedUserIds) => async (ctx, next) => {
  const userId = ctx.from?.id;

  if (allowedUserIds?.includes(userId)) {
    return next();
  }

  await ctx.reply('Извините, это приватный бот — вы не можете им пользоваться.');

  return;
};
