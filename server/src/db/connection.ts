import mysql from 'mysql2/promise'
import { config } from '../config.js'

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  maxIdle: config.db.maxIdle,
  idleTimeout: config.db.idleTimeout,
  queueLimit: config.db.queueLimit,
  enableKeepAlive: config.db.enableKeepAlive,
  keepAliveInitialDelay: config.db.keepAliveInitialDelay,
  charset: 'utf8mb4',
})
