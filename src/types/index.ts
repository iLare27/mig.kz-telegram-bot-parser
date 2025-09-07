import { Context, SessionFlavor } from "grammy";

// Session data interface
export interface SessionData {
  step?: "idle" | "setting_threshold" | "setting_currency" | "setting_source";
  tempThreshold?: number;
  tempCurrency?: string;
  tempSource?: string;
}

// Extended context with session
export type MyContext = Context & SessionFlavor<SessionData>;

// Currency rate interface
export interface CurrencyRate {
  id?: number;
  source: string;
  currency: string;
  value: number;
  timestamp: Date;
}

// User settings interface
export interface UserSettings {
  id?: number;
  userId: number;
  currency: string;
  source: string;
  thresholdPercent: number;
  notifyEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// User interface
export interface User {
  id?: number;
  telegramId: number;
  language?: string;
  createdAt?: Date;
}

// Parser result interface
export interface ParserResult {
  source: string;
  currency: string;
  value: number;
  timestamp: Date;
}

// Notification interface
export interface Notification {
  userId: number;
  message: string;
  timestamp: Date;
}
