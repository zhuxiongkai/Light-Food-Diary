import 'dotenv/config'
import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'
import { migrate } from 'drizzle-orm/mysql2/migrator'
import { config } from '../config.js'

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
  })

  // Create database if not exists
  await connection.execute(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )
  await connection.end()

  // Connect to the target database and run migrations
  const dbConnection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  })

  const db = drizzle(dbConnection)
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrations completed successfully.')
  await dbConnection.end()
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
