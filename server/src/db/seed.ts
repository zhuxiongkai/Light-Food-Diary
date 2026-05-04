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

  const [rows] = await connection.execute('SELECT name FROM foods WHERE user_id IS NULL')
  const existingNames = new Set((rows as Array<{ name: string }>).map((row) => row.name))
  const missingFoods = seedFoods.filter((food) => !existingNames.has(food.name))

  if (missingFoods.length === 0) {
    console.log(`Built-in foods already up to date (${existingNames.size} rows).`)
    await connection.end()
    return
  }

  // Batch in groups of 50 to avoid SQL too large
  const batchSize = 50
  for (let i = 0; i < missingFoods.length; i += batchSize) {
    const batch = missingFoods.slice(i, i + batchSize)
    const placeholders = batch.map(() => '(NULL, ?, ?, ?, ?, ?, ?)').join(', ')
    const params = batch.flatMap((food) => [
      food.name,
      food.category,
      food.caloriesPer100g,
      food.protein,
      food.fat,
      food.carbs,
    ])

    await connection.execute(
      `INSERT INTO foods (user_id, name, category, calories_per_100g, protein, fat, carbs) VALUES ${placeholders}`,
      params
    )
  }

  console.log(`Seeded ${missingFoods.length} missing built-in foods. Total built-in foods: ${existingNames.size + missingFoods.length}.`)
  await connection.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
