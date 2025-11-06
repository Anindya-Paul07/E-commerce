import dotenv from 'dotenv';
import { bool, cleanEnv, num, str } from 'envalid';

dotenv.config();

const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: 'development', choices: ['development', 'test', 'production'] }),
  PORT: num({ default: 4000 }),
  MONGO_URI: str({ devDefault: 'mongodb://127.0.0.1:27017/ecom' }),
  JWT_SECRET: str({ devDefault: 'dev_secret_change_me' }),
  CLIENT_ORIGIN: str({ devDefault: 'http://localhost:5173' }),
  COOKIE_NAME: str({ default: 'ecom_jwt' }),
  COOKIE_SECURE: bool({ default: false }),
  COOKIE_SAMESITE: str({ default: 'lax', choices: ['lax', 'strict', 'none'] }),
  LOG_LEVEL: str({ default: 'info' }),
});

export const ENV = Object.freeze(env);
