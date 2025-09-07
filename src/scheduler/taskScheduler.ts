import cron from "node-cron";
import { CurrencyService } from "../services/currencyService.js";
import { NotificationService } from "../services/notificationService.js";
import { UserService } from "../services/userService.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./config.env" });

export class TaskScheduler {
  private static isInitialized = false;

  /**
   * Инициализирует планировщик задач
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("Планировщик уже инициализирован");
      return;
    }

    // Автоматически обновить курсы валют и сохранить в БД при запуске
    await this.updateCurrencyRates();

    // Обновление курсов валют каждый час
    cron.schedule("0 * * * *", async () => {
      console.log("🔄 Обновление курсов валют...");
      await this.updateCurrencyRates();
    });

    // Проверка уведомлений каждые 30 минут
    cron.schedule("*/30 * * * *", async () => {
      console.log("🔔 Проверка уведомлений...");
      await this.checkNotifications();
    });

    // Ежедневный отчет в 9:00
    cron.schedule("0 9 * * *", async () => {
      console.log("📊 Отправка ежедневных отчетов...");
      await this.sendDailyReports();
    });

    // Статистика администратору каждый день в 10:00
    cron.schedule("0 10 * * *", async () => {
      console.log("📈 Отправка статистики администратору...");
      await this.sendAdminStats();
    });

    // Очистка старых записей курсов (старше 30 дней) каждый день в 2:00
    cron.schedule("0 2 * * *", async () => {
      console.log("🧹 Очистка старых записей курсов...");
      await this.cleanupOldRates();
    });

    this.isInitialized = true;
    console.log("✅ Планировщик задач инициализирован");
  }

  /**
   * Обновляет курсы валют из всех источников
   */
  private static async updateCurrencyRates(): Promise<void> {
    try {
      const sources = ["mig.kz"];
      const currencies = ["USD"];

      for (const source of sources) {
        for (const currency of currencies) {
          try {
            await CurrencyService.updateCurrencyRates(source);
            console.log(`✅ Курс ${currency} из ${source} обновлен`);
          } catch (error) {
            console.error(`❌ Ошибка обновления курса ${currency} из ${source}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Ошибка при обновлении курсов:", error);
    }
  }

  /**
   * Проверяет и отправляет уведомления
   */
  private static async checkNotifications(): Promise<void> {
    try {
      await NotificationService.checkAndSendNotifications();
    } catch (error) {
      console.error("Ошибка при проверке уведомлений:", error);
    }
  }

  /**
   * Отправляет ежедневные отчеты всем пользователям с включенными уведомлениями
   */
  private static async sendDailyReports(): Promise<void> {
    try {
      // Получаем всех пользователей с включенными уведомлениями
      const usersWithNotifications = await CurrencyService.getUsersWithNotifications();
      
      for (const settings of usersWithNotifications) {
        try {
          await NotificationService.sendDailyReport(settings.user.telegramId);
          // Небольшая задержка между отправками
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Ошибка отправки ежедневного отчета пользователю ${settings.user.telegramId}:`, error);
        }
      }
    } catch (error) {
      console.error("Ошибка при отправке ежедневных отчетов:", error);
    }
  }

  /**
   * Отправляет статистику администратору
   */
  private static async sendAdminStats(): Promise<void> {
    try {
      // ID администратора (замените на реальный ID)
      const adminId = 123456789; // Замените на ваш Telegram ID
      
      await NotificationService.sendAdminStats(adminId);
    } catch (error) {
      console.error("Ошибка при отправке статистики администратору:", error);
    }
  }

  /**
   * Очищает старые записи курсов валют
   */
  private static async cleanupOldRates(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const currencyRepository = CurrencyService["currencyRepository"];
      const deletedCount = await currencyRepository
        .createQueryBuilder()
        .delete()
        .where("timestamp < :date", { date: thirtyDaysAgo })
        .execute();

      console.log(`🧹 Удалено ${deletedCount.affected || 0} старых записей курсов`);
    } catch (error) {
      console.error("Ошибка при очистке старых записей:", error);
    }
  }

  /**
   * Запускает немедленное обновление курсов (для тестирования)
   */
  static async runImmediateUpdate(): Promise<void> {
    console.log("🚀 Запуск немедленного обновления курсов...");
    await this.updateCurrencyRates();
  }

  /**
   * Запускает немедленную проверку уведомлений (для тестирования)
   */
  static async runImmediateNotificationCheck(): Promise<void> {
    console.log("🚀 Запуск немедленной проверки уведомлений...");
    await this.checkNotifications();
  }
}
