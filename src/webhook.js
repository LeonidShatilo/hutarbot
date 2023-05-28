const setWebhookWithDelay = ({ bot, webhookUrl, delay }) => {
  setTimeout(async () => {
    try {
      await bot.telegram.setWebhook(webhookUrl);

      console.log('Webhook has been set successfully.');
    } catch (error) {
      console.error('Failed to set webhook with delay: ', error);
    }
  }, delay);
};

export const setWebhook = async (bot, webhookUrl) => {
  try {
    await bot.telegram.setWebhook(webhookUrl);

    console.log('Webhook has been set successfully.');
  } catch (error) {
    if (error.code === 429) {
      const retryAfter = error.parameters.retry_after || 1;

      console.log(`Too many requests. Retrying after ${retryAfter} second(s).`);

      setWebhookWithDelay({ bot, webhookUrl, delay: retryAfter * 1000 });
    } else {
      console.error('Failed to set webhook: ', error);
    }
  }
};
