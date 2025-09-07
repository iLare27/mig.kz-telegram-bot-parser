import { Bot, InlineKeyboard } from "grammy";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./config.env" });

// Create bot instance
const bot = new Bot(process.env.BOT_TOKEN || "");

// /start command
bot.command("start", async (ctx) => {
  const welcomeMessage = `🎉 Welcome to the currency tracking bot!

I will help you track changes in the USD and other currencies.

Available commands:
/rate - Get the current USD rate
/settings - Notification settings
/help - Command help

Start with /rate to get the current rate!`;
  await ctx.reply(welcomeMessage);
});

// /rate command
bot.command("rate", async (ctx) => {
  const message = `💱 USD Rate

Current rate: 480.25 USD (example)
Change in 24h: 📈 0.5%
Source: mig.kz
Last update: ${new Date().toLocaleString("en-US")}

⚠️ This is test mode. Real data will be available after database setup.`;
  await ctx.reply(message);
});

// /settings command
bot.command("settings", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("💱 Change currency", "settings_currency")
    .text("🌐 Change source", "settings_source").row()
    .text("📊 Change threshold", "settings_threshold")
    .text("🔔 Notifications", "settings_notifications").row()
    .text("📋 My settings", "my_settings");

  const message = `⚙️ Notification settings

Current settings:
• Currency: USD
• Source: mig.kz
• Notification threshold: 1.0%
• Notifications: ❌ Disabled

Select what you want to change:`;
  await ctx.reply(message, { reply_markup: keyboard });
});

// /help command
bot.command("help", async (ctx) => {
  const helpMessage = `📚 Command help

Main commands:
/start - Registration and greeting
/rate - Get current USD rate
/settings - Notification settings
/help - This help

💡 How it works:
1. Use /start to register
2. Set parameters via /settings
3. Get currency info

Supported currencies: USD, EUR, RUB
Data sources: mig.kz

❓ For questions, contact the administrator.`;
  await ctx.reply(helpMessage);
});

// Callback queries
bot.callbackQuery("settings_currency", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("USD", "set_currency_USD")
    .text("EUR", "set_currency_EUR").row()
    .text("RUB", "set_currency_RUB").row()
    .text("« Back", "settings");
  await ctx.editMessageText("💱 Select currency to track:", { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery("settings_source", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("mig.kz", "set_source_mig.kz").row()
    .text("« Back", "settings");
  await ctx.editMessageText("🌐 Select data source:", { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery("settings_threshold", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("0.5%", "set_threshold_0.5")
    .text("1.0%", "set_threshold_1.0").row()
    .text("2.0%", "set_threshold_2.0")
    .text("5.0%", "set_threshold_5.0").row()
    .text("« Back", "settings");
  await ctx.editMessageText("📊 Select notification threshold (%):", { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

bot.callbackQuery("settings_notifications", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("✅ Enable", "notify_on")
    .text("❌ Disable", "notify_off").row()
    .text("« Back", "settings");
  await ctx.editMessageText("🔔 Manage notifications:", { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

// Currency selection
bot.callbackQuery(/^set_currency_(.+)$/, async (ctx) => {
  const currency = ctx.match[1];
  await ctx.answerCallbackQuery(`✅ Currency changed to ${currency}`);
  const keyboard = new InlineKeyboard()
    .text("💱 Change currency", "settings_currency")
    .text("🌐 Change source", "settings_source").row()
    .text("📊 Change threshold", "settings_threshold")
    .text("🔔 Notifications", "settings_notifications").row()
    .text("📋 My settings", "my_settings");
  await ctx.editMessageText("⚙️ Settings updated! Select what you want to change:", { reply_markup: keyboard });
});

// Source selection
bot.callbackQuery(/^set_source_(.+)$/, async (ctx) => {
  const source = ctx.match[1];
  await ctx.answerCallbackQuery(`✅ Source changed to ${source}`);
  const keyboard = new InlineKeyboard()
    .text("💱 Change currency", "settings_currency")
    .text("🌐 Change source", "settings_source").row()
    .text("📊 Change threshold", "settings_threshold")
    .text("🔔 Notifications", "settings_notifications").row()
    .text("📋 My settings", "my_settings");
  await ctx.editMessageText("⚙️ Settings updated! Select what you want to change:", { reply_markup: keyboard });
});

// Threshold selection
bot.callbackQuery(/^set_threshold_(.+)$/, async (ctx) => {
  const threshold = ctx.match[1];
  await ctx.answerCallbackQuery(`✅ Threshold changed to ${threshold}%`);
  const keyboard = new InlineKeyboard()
    .text("💱 Change currency", "settings_currency")
    .text("🌐 Change source", "settings_source").row()
    .text("📊 Change threshold", "settings_threshold")
    .text("🔔 Notifications", "settings_notifications").row()
    .text("📋 My settings", "my_settings");
  await ctx.editMessageText("⚙️ Settings updated! Select what you want to change:", { reply_markup: keyboard });
});

// Notification toggle
bot.callbackQuery("notify_on", async (ctx) => {
  await ctx.answerCallbackQuery("✅ Notifications enabled!");
  const keyboard = new InlineKeyboard()
    .text("💱 Change currency", "settings_currency")
    .text("🌐 Change source", "settings_source").row()
    .text("📊 Change threshold", "settings_threshold")
    .text("🔔 Notifications", "settings_notifications").row()
    .text("📋 My settings", "my_settings");
  await ctx.editMessageText("⚙️ Settings updated! Select what you want to change:", { reply_markup: keyboard });
});

bot.callbackQuery("notify_off", async (ctx) => {
  await ctx.answerCallbackQuery("❌ Notifications disabled!");
  const keyboard = new InlineKeyboard()
    .text("💱 Change currency", "settings_currency")
    .text("🌐 Change source", "settings_source").row()
    .text("📊 Change threshold", "settings_threshold")
    .text("🔔 Notifications", "settings_notifications").row()
    .text("📋 My settings", "my_settings");
  await ctx.editMessageText("⚙️ Settings updated! Select what you want to change:", { reply_markup: keyboard });
});

// Settings back
bot.callbackQuery("settings", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("💱 Change currency", "settings_currency")
    .text("🌐 Change source", "settings_source").row()
    .text("📊 Change threshold", "settings_threshold")
    .text("🔔 Notifications", "settings_notifications").row()
    .text("📋 My settings", "my_settings");
  const message = `⚙️ Notification settings

Current settings:
• Currency: USD
• Source: mig.kz
• Notification threshold: 1.0%
• Notifications: ❌ Disabled

Select what you want to change:`;
  await ctx.editMessageText(message, { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

// My settings
bot.callbackQuery("my_settings", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("« Back to settings", "settings");
  const message = `📋 Your settings

💱 Currency: USD
🌐 Source: mig.kz
📊 Notification threshold: 1.0%
🔔 Notifications: ❌ Disabled

Registration date: ${new Date().toLocaleDateString("en-US")}
Last update: ${new Date().toLocaleDateString("en-US")}`;
  await ctx.editMessageText(message, { reply_markup: keyboard });
  await ctx.answerCallbackQuery();
});

// Unknown callback queries
bot.on("callback_query:data", async (ctx) => {
  console.log("Unknown callback:", ctx.callbackQuery.data);
  await ctx.answerCallbackQuery();
});

// Error handling
bot.catch((err) => {
  console.error("Bot error:", err);
});

// Graceful shutdown
process.once("SIGINT", () => {
  console.log("Shutting down bot...");
  bot.stop();
});

process.once("SIGTERM", () => {
  console.log("Shutting down bot...");
  bot.stop();
});

// Start the bot
async function startBot() {
  try {
    console.log("🚀 Starting simple currency bot...");
    await bot.start();
    console.log("✅ Bot started successfully");
    console.log("🎉 Bot is ready to receive messages!");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Start the bot
startBot();
