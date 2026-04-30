import 'dotenv/config'
import mysql from 'mysql2/promise'
import { config } from '../config.js'
import { seedFoods } from '../data/seedFoods.js'

async function seed() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  })

  // Check if foods already seeded
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM foods')
  const count = (rows as any[])[0]?.count || 0
  if (count > 0) {
    console.log(`Foods table already has ${count} rows, skipping seed.`)
    await connection.end()
    return
  }

  // Bulk insert using raw SQL for efficiency
  const values: string[] = []
  for (const food of seedFoods) {
    values.push(
      `(NULL, '${food.name.replace(/'/g, "\\'")}', '${food.category}', ${food.caloriesPer100g}, ${food.protein}, ${food.fat}, ${food.carbs})`
    )
  }

  // Batch in groups of 50 to avoid SQL too large
  const batchSize = 50
  for (let i = 0; i < values.length; i += batchSize) {
    const batch = values.slice(i, i + batchSize)
    await connection.execute(
      `INSERT INTO foods (user_id, name, category, calories_per_100g, protein, fat, carbs) VALUES ${batch.join(', ')}`
    )
  }

  console.log(`Seeded ${seedFoods.length} built-in foods.`)
  await connection.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
