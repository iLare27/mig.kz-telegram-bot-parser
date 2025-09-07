import { Bot, InlineKeyboard } from "grammy";
import { MyContext } from "../types/index.js";
import { UserService } from "../services/userService.js";
import { CurrencyService } from "../services/currencyService.js";
import { NotificationService } from "../services/notificationService.js";

export function setupCommands(bot: Bot<MyContext>): void {
  // Команда /start
  bot.command("start", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const user = await UserService.registerUser(telegramId, ctx.from?.language_code);
      
      const welcomeMessage = `🎉 Добро пожаловать в бот отслеживания курсов валют!

Я помогу вам отслеживать изменения курса доллара и других валют.

📋 Доступные команды:
/rate - Получить текущий курс доллара
/settings - Настройка уведомлений
/notify_on - Включить уведомления
/notify_off - Отключить уведомления
/my_settings - Показать текущие настройки
/help - Справка по командам

Начните с команды /rate для получения текущего курса!`;

      await ctx.reply(welcomeMessage);
    } catch (error) {
      console.error("Ошибка в команде start:", error);
      await ctx.reply("❌ Произошла ошибка при регистрации. Попробуйте позже.");
    }
  });

  // Команда /rate
  bot.command("rate", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply("❌ Пользователь не найден. Используйте /start для регистрации.");
        return;
      }

      const settings = await UserService.getUserSettings(user.id);
      if (!settings) {
        await ctx.reply("❌ Настройки не найдены. Используйте /start для регистрации.");
        return;
      }

      // Получаем текущий курс
      const currentRate = await CurrencyService.getLatestRate(settings.source, settings.currency);
      
      if (!currentRate) {
        await ctx.reply("❌ Не удалось получить текущий курс. Попробуйте позже.");
        return;
      }

      // Получаем изменение за 24 часа
      const change = await CurrencyService.calculateRateChange(settings.source, settings.currency);
      const direction = change > 0 ? "📈" : change < 0 ? "📉" : "➡️";
      const changeText = change !== 0 ? `${direction} ${Math.abs(change).toFixed(2)}%` : "Без изменений";

      const message = `💱 Курс ${settings.currency}

    Текущий курс: ${Number(currentRate.value).toFixed(2)} ${settings.currency}
Изменение за 24 часа: ${changeText}
Источник: ${settings.source}
Время обновления: ${currentRate.timestamp.toLocaleString("ru-RU")}`;

      await ctx.reply(message);
    } catch (error) {
      console.error("Ошибка в команде rate:", error);
      await ctx.reply("❌ Произошла ошибка при получении курса. Попробуйте позже.");
    }
  });

  // Команда /settings
  bot.command("settings", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply("❌ Пользователь не найден. Используйте /start для регистрации.");
        return;
      }

      const settings = await UserService.getUserSettings(user.id);
      if (!settings) {
        await ctx.reply("❌ Настройки не найдены. Используйте /start для регистрации.");
        return;
      }

      const keyboard = new InlineKeyboard()
        .text("💱 Изменить валюту", "settings_currency")
        .text("🌐 Изменить источник", "settings_source").row()
        .text("📊 Изменить порог", "settings_threshold")
        .text("🔔 Уведомления", "settings_notifications").row()
        .text("📋 Мои настройки", "my_settings");

      const message = `⚙️ Настройки уведомлений

Текущие настройки:
• Валюта: ${settings.currency}
• Источник: ${settings.source}
• Порог уведомлений: ${settings.thresholdPercent}%
• Уведомления: ${settings.notifyEnabled ? "✅ Включены" : "❌ Отключены"}

Выберите, что хотите изменить:`;

      await ctx.reply(message, { reply_markup: keyboard });
    } catch (error) {
      console.error("Ошибка в команде settings:", error);
      await ctx.reply("❌ Произошла ошибка при загрузке настроек. Попробуйте позже.");
    }
  });

  // Команда /notify_on
  bot.command("notify_on", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply("❌ Пользователь не найден. Используйте /start для регистрации.");
        return;
      }

      await UserService.enableNotifications(user.id);
      await ctx.reply("✅ Уведомления включены! Вы будете получать уведомления при изменении курса.");
    } catch (error) {
      console.error("Ошибка в команде notify_on:", error);
      await ctx.reply("❌ Произошла ошибка при включении уведомлений. Попробуйте позже.");
    }
  });

  // Команда /notify_off
  bot.command("notify_off", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply("❌ Пользователь не найден. Используйте /start для регистрации.");
        return;
      }

      await UserService.disableNotifications(user.id);
      await ctx.reply("❌ Уведомления отключены! Вы больше не будете получать уведомления.");
    } catch (error) {
      console.error("Ошибка в команде notify_off:", error);
      await ctx.reply("❌ Произошла ошибка при отключении уведомлений. Попробуйте позже.");
    }
  });

  // Команда /my_settings
  bot.command("my_settings", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply("❌ Пользователь не найден. Используйте /start для регистрации.");
        return;
      }

      const settings = await UserService.getUserSettings(user.id);
      if (!settings) {
        await ctx.reply("❌ Настройки не найдены. Используйте /start для регистрации.");
        return;
      }

      const message = `📋 Ваши настройки

💱 Валюта: ${settings.currency}
🌐 Источник: ${settings.source}
📊 Порог уведомлений: ${settings.thresholdPercent}%
🔔 Уведомления: ${settings.notifyEnabled ? "✅ Включены" : "❌ Отключены"}

Дата регистрации: ${user.createdAt?.toLocaleDateString("ru-RU")}
Последнее обновление: ${settings.updatedAt?.toLocaleDateString("ru-RU")}`;

      await ctx.reply(message);
    } catch (error) {
      console.error("Ошибка в команде my_settings:", error);
      await ctx.reply("❌ Произошла ошибка при загрузке настроек. Попробуйте позже.");
    }
  });

  // Команда /help
  bot.command("help", async (ctx) => {
    const helpMessage = `📚 Справка по командам

Основные команды:
/start - Регистрация и приветствие
/rate - Получить текущий курс доллара
/settings - Настройка уведомлений
/notify_on - Включить уведомления
/notify_off - Отключить уведомления
/my_settings - Показать текущие настройки
/help - Эта справка

💡 Как это работает:
1. Используйте /start для регистрации
2. Настройте параметры через /settings
3. Включите уведомления командой /notify_on
4. Получайте уведомления при изменении курса

📊 Поддерживаемые валюты: USD, EUR, RUB
🌐 Источники данных: mig.kz

❓ Если у вас есть вопросы, обратитесь к администратору.`;

    await ctx.reply(helpMessage);
  });

  // Обработка callback-запросов
  bot.callbackQuery("settings_currency", async (ctx) => {
    try {
      const keyboard = new InlineKeyboard()
        .text("USD", "set_currency_USD")
        .text("EUR", "set_currency_EUR").row()
        .text("RUB", "set_currency_RUB").row()
        .text("« Назад", "settings");

      await ctx.editMessageText("💱 Выберите валюту для отслеживания:", { reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Ошибка в callback settings_currency:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка");
    }
  });

  bot.callbackQuery("settings_source", async (ctx) => {
    try {
      const keyboard = new InlineKeyboard()
        .text("mig.kz", "set_source_mig.kz").row()
        .text("« Назад", "settings");

      await ctx.editMessageText("🌐 Выберите источник данных:", { reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Ошибка в callback settings_source:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка");
    }
  });

  bot.callbackQuery("settings_threshold", async (ctx) => {
    try {
      const keyboard = new InlineKeyboard()
        .text("0.5%", "set_threshold_0.5")
        .text("1.0%", "set_threshold_1.0").row()
        .text("2.0%", "set_threshold_2.0")
        .text("5.0%", "set_threshold_5.0").row()
        .text("« Назад", "settings");

      await ctx.editMessageText("📊 Выберите порог уведомлений (%):", { reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Ошибка в callback settings_threshold:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка");
    }
  });

  bot.callbackQuery("settings_notifications", async (ctx) => {
    try {
      const keyboard = new InlineKeyboard()
        .text("✅ Включить", "notify_on")
        .text("❌ Отключить", "notify_off").row()
        .text("« Назад", "settings");

      await ctx.editMessageText("🔔 Управление уведомлениями:", { reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Ошибка в callback settings_notifications:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка");
    }
  });

  // Обработка установки валюты
  bot.callbackQuery(/^set_currency_(.+)$/, async (ctx) => {
    try {
      const currency = ctx.match[1];
      const telegramId = ctx.from?.id;
      
      if (!telegramId) {
        await ctx.answerCallbackQuery("❌ Ошибка: пользователь не найден");
        return;
      }

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCallbackQuery("❌ Пользователь не найден");
        return;
      }

      await UserService.setCurrency(user.id, currency);
      await ctx.answerCallbackQuery(`✅ Валюта изменена на ${currency}`);
      
      // Возвращаемся к настройкам
      const keyboard = new InlineKeyboard()
        .text("💱 Изменить валюту", "settings_currency")
        .text("🌐 Изменить источник", "settings_source").row()
        .text("📊 Изменить порог", "settings_threshold")
        .text("🔔 Уведомления", "settings_notifications").row()
        .text("📋 Мои настройки", "my_settings");

      await ctx.editMessageText("⚙️ Настройки обновлены! Выберите, что хотите изменить:", { reply_markup: keyboard });
    } catch (error) {
      console.error("Ошибка в callback set_currency:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка при изменении валюты");
    }
  });

  // Обработка установки источника
  bot.callbackQuery(/^set_source_(.+)$/, async (ctx) => {
    try {
      const source = ctx.match[1];
      const telegramId = ctx.from?.id;
      
      if (!telegramId) {
        await ctx.answerCallbackQuery("❌ Ошибка: пользователь не найден");
        return;
      }

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCallbackQuery("❌ Пользователь не найден");
        return;
      }

      await UserService.setSource(user.id, source);
      await ctx.answerCallbackQuery(`✅ Источник изменен на ${source}`);
      
      // Возвращаемся к настройкам
      const keyboard = new InlineKeyboard()
        .text("💱 Изменить валюту", "settings_currency")
        .text("🌐 Изменить источник", "settings_source").row()
        .text("📊 Изменить порог", "settings_threshold")
        .text("🔔 Уведомления", "settings_notifications").row()
        .text("📋 Мои настройки", "my_settings");

      await ctx.editMessageText("⚙️ Настройки обновлены! Выберите, что хотите изменить:", { reply_markup: keyboard });
    } catch (error) {
      console.error("Ошибка в callback set_source:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка при изменении источника");
    }
  });

  // Обработка установки порога
  bot.callbackQuery(/^set_threshold_(.+)$/, async (ctx) => {
    try {
      const threshold = parseFloat(ctx.match[1]);
      const telegramId = ctx.from?.id;
      
      if (!telegramId) {
        await ctx.answerCallbackQuery("❌ Ошибка: пользователь не найден");
        return;
      }

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCallbackQuery("❌ Пользователь не найден");
        return;
      }

      await UserService.setThreshold(user.id, threshold);
      await ctx.answerCallbackQuery(`✅ Порог изменен на ${threshold}%`);
      
      // Возвращаемся к настройкам
      const keyboard = new InlineKeyboard()
        .text("💱 Изменить валюту", "settings_currency")
        .text("🌐 Изменить источник", "settings_source").row()
        .text("📊 Изменить порог", "settings_threshold")
        .text("🔔 Уведомления", "settings_notifications").row()
        .text("📋 Мои настройки", "my_settings");

      await ctx.editMessageText("⚙️ Настройки обновлены! Выберите, что хотите изменить:", { reply_markup: keyboard });
    } catch (error) {
      console.error("Ошибка в callback set_threshold:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка при изменении порога");
    }
  });

  // Обработка включения/отключения уведомлений через callback
  bot.callbackQuery("notify_on", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        await ctx.answerCallbackQuery("❌ Ошибка: пользователь не найден");
        return;
      }

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCallbackQuery("❌ Пользователь не найден");
        return;
      }

      await UserService.enableNotifications(user.id);
      await ctx.answerCallbackQuery("✅ Уведомления включены!");
      
      // Возвращаемся к настройкам
      const keyboard = new InlineKeyboard()
        .text("💱 Изменить валюту", "settings_currency")
        .text("🌐 Изменить источник", "settings_source").row()
        .text("📊 Изменить порог", "settings_threshold")
        .text("🔔 Уведомления", "settings_notifications").row()
        .text("📋 Мои настройки", "my_settings");

      await ctx.editMessageText("⚙️ Настройки обновлены! Выберите, что хотите изменить:", { reply_markup: keyboard });
    } catch (error) {
      console.error("Ошибка в callback notify_on:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка при включении уведомлений");
    }
  });

  bot.callbackQuery("notify_off", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        await ctx.answerCallbackQuery("❌ Ошибка: пользователь не найден");
        return;
      }

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCallbackQuery("❌ Пользователь не найден");
        return;
      }

      await UserService.disableNotifications(user.id);
      await ctx.answerCallbackQuery("❌ Уведомления отключены!");
      
      // Возвращаемся к настройкам
      const keyboard = new InlineKeyboard()
        .text("💱 Изменить валюту", "settings_currency")
        .text("🌐 Изменить источник", "settings_source").row()
        .text("📊 Изменить порог", "settings_threshold")
        .text("🔔 Уведомления", "settings_notifications").row()
        .text("📋 Мои настройки", "my_settings");

      await ctx.editMessageText("⚙️ Настройки обновлены! Выберите, что хотите изменить:", { reply_markup: keyboard });
    } catch (error) {
      console.error("Ошибка в callback notify_off:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка при отключении уведомлений");
    }
  });

  // Обработка возврата к настройкам
  bot.callbackQuery("settings", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCallbackQuery("❌ Пользователь не найден");
        return;
      }

      const settings = await UserService.getUserSettings(user.id);
      if (!settings) {
        await ctx.answerCallbackQuery("❌ Настройки не найдены");
        return;
      }

      const keyboard = new InlineKeyboard()
        .text("💱 Изменить валюту", "settings_currency")
        .text("🌐 Изменить источник", "settings_source").row()
        .text("📊 Изменить порог", "settings_threshold")
        .text("🔔 Уведомления", "settings_notifications").row()
        .text("📋 Мои настройки", "my_settings");

      const message = `⚙️ Настройки уведомлений

Текущие настройки:
• Валюта: ${settings.currency}
• Источник: ${settings.source}
• Порог уведомлений: ${settings.thresholdPercent}%
• Уведомления: ${settings.notifyEnabled ? "✅ Включены" : "❌ Отключены"}

Выберите, что хотите изменить:`;

      await ctx.editMessageText(message, { reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Ошибка в callback settings:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка");
    }
  });

  // Обработка показа настроек через callback
  bot.callbackQuery("my_settings", async (ctx) => {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const user = await UserService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.answerCallbackQuery("❌ Пользователь не найден");
        return;
      }

      const settings = await UserService.getUserSettings(user.id);
      if (!settings) {
        await ctx.answerCallbackQuery("❌ Настройки не найдены");
        return;
      }

      const keyboard = new InlineKeyboard()
        .text("« Назад к настройкам", "settings");

      const message = `📋 Ваши настройки

💱 Валюта: ${settings.currency}
🌐 Источник: ${settings.source}
📊 Порог уведомлений: ${settings.thresholdPercent}%
🔔 Уведомления: ${settings.notifyEnabled ? "✅ Включены" : "❌ Отключены"}

Дата регистрации: ${user.createdAt?.toLocaleDateString("ru-RU")}
Последнее обновление: ${settings.updatedAt?.toLocaleDateString("ru-RU")}`;

      await ctx.editMessageText(message, { reply_markup: keyboard });
      await ctx.answerCallbackQuery();
    } catch (error) {
      console.error("Ошибка в callback my_settings:", error);
      await ctx.answerCallbackQuery("❌ Произошла ошибка");
    }
  });

  // Обработка неизвестных callback-запросов
  bot.on("callback_query:data", async (ctx) => {
    console.log("Неизвестный callback:", ctx.callbackQuery.data);
    await ctx.answerCallbackQuery();
  });
}
