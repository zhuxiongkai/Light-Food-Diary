import 'dotenv/config'

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'calorie_tracker',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),
    maxIdle: parseInt(process.env.DB_MAX_IDLE || '10', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '60000', 10),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '50', 10),
    enableKeepAlive: (process.env.DB_ENABLE_KEEPALIVE || 'true') !== 'false',
    keepAliveInitialDelay: parseInt(process.env.DB_KEEPALIVE_INITIAL_DELAY || '10000', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiresIn: '15m' as const,
    refreshExpiresIn: '7d' as const,
  },
  encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-bytes!!',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  baiduAi: {
    apiKey: process.env.BAIDU_AI_API_KEY || '',
    secretKey: process.env.BAIDU_AI_SECRET_KEY || '',
  },
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    /** OpenAI-compatible chat completions base URL (no trailing slash) */
    baseUrl: (process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/$/, ''),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },
}
