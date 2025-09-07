import { AppDataSource } from "../database/config";
import { CurrencyRate } from "../entities/CurrencyRate";
import { UserSettings } from "../entities/UserSettings";
import { MigParser } from "../parsers/migParser";
import { ParserResult } from "../types";
import { Between } from "typeorm";

export class CurrencyService {
  private static currencyRepository = AppDataSource.getRepository(CurrencyRate);
  private static settingsRepository = AppDataSource.getRepository(UserSettings);

  /**
   * Обновляет курс валюты из источника
   */
  static async updateCurrencyRates(source: string): Promise<CurrencyRate[]> {
    try {
      let parserResults: ParserResult[];

      switch (source) {
        case "mig.kz":
          parserResults = await MigParser.parseAllRates();
          break;
        default:
          throw new Error(`Неподдерживаемый источник: ${source}`);
      }

      // Сохраняем все курсы в базу данных
      const savedRates: CurrencyRate[] = [];
      for (const parserResult of parserResults) {
        const rate = new CurrencyRate();
        rate.source = parserResult.source;
        rate.currency = parserResult.currency;
        rate.value = parserResult.value;
        rate.timestamp = parserResult.timestamp;
        savedRates.push(await this.currencyRepository.save(rate));
      }
      console.log(savedRates);
      return savedRates;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Получает последний курс валюты
   */
  static async getLatestRate(source: string, currency: string): Promise<CurrencyRate | null> {
    return await this.currencyRepository.findOne({
      where: { source, currency },
      order: { timestamp: "DESC" }
    });
  }

  /**
   * Получает курс валюты за определенную дату
   */
  static async getRateForDate(source: string, currency: string, date: Date): Promise<CurrencyRate | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return await this.currencyRepository.findOne({
      where: {
        source,
        currency,
        timestamp: Between(startOfDay, endOfDay)
      },
      order: { timestamp: "DESC" }
    });
  }

  /**
   * Вычисляет изменение курса в процентах
   */
  static async calculateRateChange(source: string, currency: string, hours: number = 24): Promise<number> {
    const now = new Date();
    const pastDate = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const currentRate = await this.getLatestRate(source, currency);
    const pastRate = await this.currencyRepository.findOne({
      where: {
        source,
        currency,
        timestamp: Between(pastDate, now)
      },
      order: { timestamp: "ASC" }
    });

    if (!currentRate || !pastRate) {
      return 0;
    }

    const change = ((currentRate.value - pastRate.value) / pastRate.value) * 100;
    return parseFloat(change.toFixed(2));
  }

  /**
   * Получает все настройки пользователей с включенными уведомлениями
   */
  static async getUsersWithNotifications(): Promise<UserSettings[]> {
    return await this.settingsRepository.find({
      where: { notifyEnabled: true },
      relations: ["user"]
    });
  }

  /**
   * Проверяет, нужно ли отправить уведомление пользователю
   */
  static async shouldNotifyUser(userId: number): Promise<{ shouldNotify: boolean; change: number; currentRate: number }> {
    const settings = await this.settingsRepository.findOne({
      where: { userId, notifyEnabled: true }
    });

    if (!settings) {
      return { shouldNotify: false, change: 0, currentRate: 0 };
    }

    const change = await this.calculateRateChange(settings.source, settings.currency);
    const currentRate = await this.getLatestRate(settings.source, settings.currency);

    return {
      shouldNotify: Math.abs(change) >= settings.thresholdPercent,
      change,
      currentRate: currentRate?.value || 0
    };
  }

  /**
   * Получает статистику курсов за последние N дней
   */
  static async getRateHistory(source: string, currency: string, days: number = 7): Promise<CurrencyRate[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return await this.currencyRepository.find({
      where: {
        source,
        currency,
        timestamp: Between(startDate, endDate)
      },
      order: { timestamp: "ASC" }
    });
  }
}
