import { Context, NextFunction } from "grammy";
import { MyContext } from "../types";
import pino from "pino";

// Создаем логгер
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname"
    }
  }
});

/**
 * Middleware для логирования запросов
 */
export async function loggingMiddleware(ctx: MyContext, next: NextFunction) {
  const start = Date.now();
  
  try {
    await next();
    
    const duration = Date.now() - start;
    const updateType = ctx.update ? Object.keys(ctx.update)[0] : "unknown";
    
    logger.info({
      type: "request",
      updateType,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      chatId: ctx.chat?.id,
      duration,
      success: true
    });
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error({
      type: "error",
      updateType: ctx.update ? Object.keys(ctx.update)[0] : "unknown",
      userId: ctx.from?.id,
      username: ctx.from?.username,
      chatId: ctx.chat?.id,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  }
}

/**
 * Middleware для обработки ошибок
 */
export async function errorHandlerMiddleware(ctx: MyContext, next: NextFunction) {
  try {
    await next();
  } catch (error) {
    logger.error("Unhandled error:");//error
    
    // Отправляем пользователю понятное сообщение об ошибке
    try {
      await ctx.reply("❌ Произошла непредвиденная ошибка. Попробуйте позже или обратитесь к администратору.");
    } catch (replyError) {
      logger.error("Failed to send error message to user:");//replyError
    }
  }
}

/**
 * Middleware для автоматической регистрации пользователей
 */
export async function autoRegisterMiddleware(ctx: MyContext, next: NextFunction) {
  // Пропускаем команду /start, так как там уже есть регистрация
  if (ctx.message?.text === "/start") {
    return await next();
  }
  
  // Для всех остальных команд проверяем, зарегистрирован ли пользователь
  if (ctx.from?.id) {
    const { UserService } = await import("../services/userService");
    const user = await UserService.getUserByTelegramId(ctx.from.id);
    
    if (!user) {
      await ctx.reply("❌ Вы не зарегистрированы. Используйте /start для регистрации.");
      return;
    }
  }
  
  await next();
}

/**
 * Middleware для ограничения скорости запросов
 */
export async function rateLimitMiddleware(ctx: MyContext, next: NextFunction) {
  const userId = ctx.from?.id;
  if (!userId) {
    return await next();
  }
  
  // Простая реализация rate limiting
  // В продакшене лучше использовать Redis или другую систему
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Удаляем старые запросы (старше 1 минуты)
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  // Проверяем лимит (30 запросов в минуту)
  if (recentRequests.length >= 30) {
    await ctx.reply("⚠️ Слишком много запросов. Подождите немного.");
    return;
  }
  
  // Добавляем текущий запрос
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  
  await next();
}

// Map для хранения запросов пользователей (в продакшене использовать Redis)
const rateLimitMap = new Map<number, number[]>();

/**
 * Middleware для логирования статистики
 */
export async function statsMiddleware(ctx: MyContext, next: NextFunction) {
  const start = Date.now();
  
  await next();
  
  const duration = Date.now() - start;
  
  // Логируем статистику для анализа производительности
  logger.info({
    type: "stats",
    command: ctx.message?.text?.split(" ")[0] || "unknown",
    userId: ctx.from?.id,
    duration,
    timestamp: new Date().toISOString()
  });
}
