import "reflect-metadata";
import { Bot, session, SessionFlavor } from "grammy";
import { MyContext, SessionData } from "./types/index.js";
import { initializeDatabase } from "./database/config.js";
import { setupCommands } from "./commands/index.js";
import { 
  loggingMiddleware, 
  errorHandlerMiddleware, 
  autoRegisterMiddleware, 
  rateLimitMiddleware,
  statsMiddleware 
} from "./middleware/index.js";
import { NotificationService } from "./services/notificationService.js";
import { TaskScheduler } from "./scheduler/taskScheduler.js";

import dotenv from "dotenv";
// Load environment variables from .env in project root
dotenv.config({ path: ['.env.local', '.env'] });

console.log(process.env.DB_DATABASE);

// Create bot instance
const bot = new Bot<MyContext>(process.env.BOT_TOKEN || "");

// Session configuration
function initial(): SessionData {
  return {
    step: "idle"
  };
}

// Apply middleware
bot.use(session({ initial }));
bot.use(loggingMiddleware);
bot.use(errorHandlerMiddleware);
bot.use(rateLimitMiddleware);
bot.use(statsMiddleware);
bot.use(autoRegisterMiddleware);

// Setup commands
setupCommands(bot);

// Initialize services
NotificationService.initialize(bot);

// Error handling for unhandled errors
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

// Main startup function
async function startBot() {
  try {
    console.log("🚀 Starting currency bot...");
    
    // Initialize database
    await initializeDatabase();
    console.log("✅ Database initialized");
    
    // Initialize task scheduler
    TaskScheduler.initialize();
    console.log("✅ Task scheduler initialized");
    
    // Start the bot
    await bot.start();
    console.log("✅ Bot started successfully");
    
    // Run initial currency update
    await TaskScheduler.runImmediateUpdate();
    
    console.log("✅ Initial currency update completed");
    
    console.log("🎉 Bot is ready to receive messages!");
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

// Start the bot
startBot();

setTimeout(async () => {
  await TaskScheduler.runImmediateNotificationCheck();
}, 5000);