
import axios from "axios";
import * as cheerio from "cheerio";
import { ParserResult } from "../types";

export class MigParser {
  private static readonly URL = "https://mig.kz/";

  /**
   * Парсит все курсы валют с сайта mig.kz
   */
  static async parseAllRates(): Promise<ParserResult[]> {
    try {
      console.log(`Fetching data from ${this.URL}`);
      const response = await axios.get(this.URL, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });

      const $ = cheerio.load(response.data);
      const results: ParserResult[] = [];

      // Парсим таблицу курсов из блока .informer
      $(".informer table tr").each((_, row) => {
        const buy = $(row).find("td.buy").text().replace(",", ".").trim();
        const currency = $(row).find("td.currency").text().trim();
        const sell = $(row).find("td.sell").text().replace(",", ".").trim();
        if (currency) {
          results.push({
            source: "mig.kz",
            currency,
            value: parseFloat(sell), // Можно добавить sell при необходимости
            timestamp: new Date()
          });
        }
      });

      if (results.length === 0) {
        throw new Error("Не удалось найти курсы валют на странице");
      }

      return results;
    } catch (error) {
      throw error;
    }
  }
}
