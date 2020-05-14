import * as dotenv from "dotenv";

const result = dotenv.config();

if (result.error) {
  console.log(result.error);
  // This error should crash whole process
  throw new Error("⚠️  Couldn't load .env file  ⚠️");
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT),
  storage: {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    pass: process.env.PG_PASS,
    db: process.env.PG_DB,
  },
  log: {
    level: process.env.LOG_LEVEL,
  },
  isProd: process.env.NODE_ENV === "production",
};
