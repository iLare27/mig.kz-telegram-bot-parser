import { AppDataSource } from "../database/config";
import { User } from "../entities/User";
import { UserSettings } from "../entities/UserSettings";

export class UserService {
  private static userRepository = AppDataSource.getRepository(User);
  private static settingsRepository = AppDataSource.getRepository(UserSettings);

  /**
   * Регистрирует нового пользователя или возвращает существующего
   */
  static async registerUser(telegramId: number, language?: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { telegramId }
    });

    if (!user) {
      user = new User();
      user.telegramId = telegramId;
      user.language = language;
      user = await this.userRepository.save(user);

      // Создаем настройки по умолчанию
      const defaultSettings = new UserSettings();
      defaultSettings.userId = user.id;
      defaultSettings.currency = "USD";
      defaultSettings.source = "mig.kz";
      defaultSettings.thresholdPercent = 1.0;
      defaultSettings.notifyEnabled = true;
      await this.settingsRepository.save(defaultSettings);
    }

    return user;
  }

  /**
   * Получает пользователя по Telegram ID
   */
  static async getUserByTelegramId(telegramId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { telegramId },
      relations: ["settings"]
    });
  }

  /**
   * Получает настройки пользователя
   */
  static async getUserSettings(userId: number): Promise<UserSettings | null> {
    return await this.settingsRepository.findOne({
      where: { userId }
    });
  }

  /**
   * Обновляет настройки пользователя
   */
  static async updateUserSettings(
    userId: number,
    updates: Partial<UserSettings>
  ): Promise<UserSettings> {
    const settings = await this.getUserSettings(userId);
    
    if (!settings) {
      throw new Error("Настройки пользователя не найдены");
    }

    Object.assign(settings, updates);
    return await this.settingsRepository.save(settings);
  }

  /**
   * Включает уведомления для пользователя
   */
  static async enableNotifications(userId: number): Promise<void> {
    await this.updateUserSettings(userId, { notifyEnabled: true });
  }

  /**
   * Отключает уведомления для пользователя
   */
  static async disableNotifications(userId: number): Promise<void> {
    await this.updateUserSettings(userId, { notifyEnabled: false });
  }

  /**
   * Устанавливает порог уведомлений
   */
  static async setThreshold(userId: number, threshold: number): Promise<void> {
    if (threshold < 0.1 || threshold > 50) {
      throw new Error("Порог должен быть от 0.1% до 50%");
    }

    await this.updateUserSettings(userId, { thresholdPercent: threshold });
  }

  /**
   * Устанавливает валюту для отслеживания
   */
  static async setCurrency(userId: number, currency: string): Promise<void> {
    const supportedCurrencies = ["USD", "EUR", "RUB"];
    if (!supportedCurrencies.includes(currency.toUpperCase())) {
      throw new Error(`Неподдерживаемая валюта. Поддерживаемые валюты: ${supportedCurrencies.join(", ")}`);
    }

    await this.updateUserSettings(userId, { currency: currency.toUpperCase() });
  }

  /**
   * Устанавливает источник данных
   */
  static async setSource(userId: number, source: string): Promise<void> {
    const supportedSources = ["mig.kz"];
    if (!supportedSources.includes(source)) {
      throw new Error(`Неподдерживаемый источник. Поддерживаемые источники: ${supportedSources.join(", ")}`);
    }

    await this.updateUserSettings(userId, { source });
  }

  /**
   * Получает статистику пользователей
   */
  static async getUserStats(): Promise<{
    totalUsers: number;
    activeNotifications: number;
    mostUsedCurrency: string;
    mostUsedSource: string;
  }> {
    const totalUsers = await this.userRepository.count();
    const activeNotifications = await this.settingsRepository.count({
      where: { notifyEnabled: true }
    });

    const currencyStats = await this.settingsRepository
      .createQueryBuilder("settings")
      .select("settings.currency", "currency")
      .addSelect("COUNT(*)", "count")
      .groupBy("settings.currency")
      .orderBy("count", "DESC")
      .limit(1)
      .getRawOne();

    const sourceStats = await this.settingsRepository
      .createQueryBuilder("settings")
      .select("settings.source", "source")
      .addSelect("COUNT(*)", "count")
      .groupBy("settings.source")
      .orderBy("count", "DESC")
      .limit(1)
      .getRawOne();

    return {
      totalUsers,
      activeNotifications,
      mostUsedCurrency: currencyStats?.currency || "USD",
      mostUsedSource: sourceStats?.source || "mig.kz"
    };
  }
}
