import { Bot } from "grammy";
import { CurrencyService } from "./currencyService";
import { UserService } from "./userService";
import { UserSettings } from "../entities/UserSettings";

export class NotificationService {
  private static bot: Bot<any>;

  /**
   * Инициализирует сервис уведомлений
   */
  static initialize(bot: Bot<any>): void {
    this.bot = bot;
  }

  /**
   * Проверяет всех пользователей и отправляет уведомления при необходимости
   */
  static async checkAndSendNotifications(): Promise<void> {
    try {
      const usersWithNotifications = await CurrencyService.getUsersWithNotifications();
      
      for (const settings of usersWithNotifications) {
        await this.checkAndNotifyUser(settings);
      }
    } catch (error) {
      console.error("Ошибка при проверке уведомлений:", error);
    }
  }

  /**
   * Проверяет конкретного пользователя и отправляет уведомление при необходимости
   */
  static async checkAndNotifyUser(settings: UserSettings): Promise<void> {
    try {
      const { shouldNotify, change, currentRate } = await CurrencyService.shouldNotifyUser(settings.userId);

      if (shouldNotify) {
        await this.sendRateChangeNotification(settings, change, currentRate);
      }
    } catch (error) {
      console.error(`Ошибка при проверке пользователя ${settings.userId}:`, error);
    }
  }

  /**
   * Отправляет уведомление об изменении курса
   */
   static async sendRateChangeNotification(
    settings: UserSettings,
    change: number,
    currentRate: any // исправлено: может быть объект или число
  ): Promise<void> {
    try {
      const direction = change > 0 ? "📈 вырос" : "📉 упал";
      const changeText = Math.abs(change).toFixed(2);

      const message = `🚨 Уведомление об изменении курса!

Курс ${settings.currency} ${direction} на ${changeText}% за последние 24 часа.

Текущий курс: ${Math.round(currentRate * 100) / 100} ${settings.currency}
Источник: ${settings.source}

Порог уведомления: ${settings.thresholdPercent}%`;

      await this.bot.api.sendMessage(settings.user.telegramId, message);

      console.log(`Уведомление отправлено пользователю ${settings.user.telegramId}`);
    } catch (error) {
      console.error(`Ошибка отправки уведомления пользователю ${settings.user.telegramId}:`, error);
    }
  }

  /**
   * Отправляет ежедневный отчет о курсе
   */
  static async sendDailyReport(userId: number): Promise<void> {
    try {
      const user = await UserService.getUserByTelegramId(userId);
      if (!user) return;

      const settings = await UserService.getUserSettings(user.id);
      if (!settings) return;

      const currentRate = await CurrencyService.getLatestRate(settings.source, settings.currency);
      const yesterdayRate = await CurrencyService.getRateForDate(
        settings.source,
        settings.currency,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (!currentRate) {
        await this.bot.api.sendMessage(userId, "❌ Не удалось получить текущий курс валюты.");
        return;
      }

      let changeText = "Нет данных для сравнения";
      if (yesterdayRate) {
        const change = ((currentRate.value - yesterdayRate.value) / yesterdayRate.value) * 100;
        const direction = change > 0 ? "📈" : "📉";
        changeText = `${direction} ${change.toFixed(2)}%`;
      }

      const message = `📊 Ежедневный отчет о курсе ${settings.currency}

Текущий курс: ${currentRate.value.toFixed(2)} ${settings.currency}
Изменение за 24 часа: ${changeText}
Источник: ${settings.source}
Время обновления: ${currentRate.timestamp.toLocaleString("ru-RU")}`;

      await this.bot.api.sendMessage(userId, message);
    } catch (error) {
      console.error(`Ошибка отправки ежедневного отчета пользователю ${userId}:`, error);
    }
  }

  /**
   * Отправляет сообщение об ошибке парсинга
   */
  static async sendParsingErrorNotification(userId: number, source: string): Promise<void> {
    try {
      const message = `⚠️ Внимание!

Не удалось получить актуальный курс валюты из источника ${source}.

Возможные причины:
• Сайт временно недоступен
• Изменена структура страницы
• Проблемы с сетью

Попробуйте позже или обратитесь к администратору.`;

      await this.bot.api.sendMessage(userId, message);
    } catch (error) {
      console.error(`Ошибка отправки уведомления об ошибке пользователю ${userId}:`, error);
    }
  }

  /**
   * Отправляет статистику администратору
   */
  static async sendAdminStats(adminId: number): Promise<void> {
    try {
      const stats = await UserService.getUserStats();
      
      const message = `📊 Статистика бота

👥 Всего пользователей: ${stats.totalUsers}
🔔 Активных уведомлений: ${stats.activeNotifications}
💱 Популярная валюта: ${stats.mostUsedCurrency}
🌐 Популярный источник: ${stats.mostUsedSource}

Время: ${new Date().toLocaleString("ru-RU")}`;

      await this.bot.api.sendMessage(adminId, message);
    } catch (error) {
      console.error(`Ошибка отправки статистики администратору ${adminId}:`, error);
    }
  }
}
