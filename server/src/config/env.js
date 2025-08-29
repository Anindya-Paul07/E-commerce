import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb+srv://anindya209:d123@cluster0.yylrtxe.mongodb.net/ecom?retryWrites=true&w=majority&appName=Cluster0",
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret_change_me",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  COOKIE_NAME: process.env.COOKIE_NAME || "ecom_jwt",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true",
};
