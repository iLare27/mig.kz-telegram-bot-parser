import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { UserSettings } from "../entities/UserSettings";
import { CurrencyRate } from "../entities/CurrencyRate";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ['.env.local', '.env'] });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "test",
  synchronize: true, // В продакшене должно быть false
  // logging: process.env.NODE_ENV === "development",
  entities: [User, UserSettings, CurrencyRate],
  subscribers: [],
  migrations: [],
});

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};
