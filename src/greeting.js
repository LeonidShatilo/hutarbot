export const greeting = () => async (ctx) => {
  const firstName = ctx.from?.first_name || '';

  const greetingMessage = firstName ? `Привет, ${firstName}!` : 'Привет!';

  const message = `${greetingMessage} Я – искусственный интеллект. Меня зовут OpenAI. Я создан для того, чтобы помогать людям в решении различных задач. Задай мне любой вопрос и я постараюсь помочь тебе!`;

  await ctx.reply(message);
};
