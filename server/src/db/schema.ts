import {
  mysqlTable,
  int,
  varchar,
  float,
  date,
  timestamp,
  mysqlEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core'

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})

export const userSettings = mysqlTable('user_settings', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  dailyCalorieGoal: int('daily_calorie_goal').notNull().default(2000),
  proteinRatio: float('protein_ratio').notNull().default(20),
  fatRatio: float('fat_ratio').notNull().default(25),
  carbsRatio: float('carbs_ratio').notNull().default(55),
  height: float('height').notNull().default(170),
  weight: float('weight').notNull().default(65),
  age: int('age').notNull().default(25),
  gender: mysqlEnum('gender', ['male', 'female']).notNull().default('male'),
  weightGoal: float('weight_goal').notNull().default(60),
  aiApiKey: varchar('ai_api_key', { length: 255 }),
})

export const foods = mysqlTable('foods', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  category: mysqlEnum('category', [
    'staple', 'meat', 'vegetable', 'fruit', 'snack', 'drink', 'custom',
  ]).notNull(),
  caloriesPer100g: float('calories_per_100g').notNull(),
  protein: float('protein').notNull(),
  fat: float('fat').notNull(),
  carbs: float('carbs').notNull(),
})

export const mealRecords = mysqlTable('meal_records', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  mealType: mysqlEnum('meal_type', [
    'breakfast', 'lunch', 'dinner', 'snack',
  ]).notNull(),
  foodId: int('food_id').notNull(),
  foodName: varchar('food_name', { length: 100 }).notNull(),
  weight: float('weight').notNull(),
  calories: float('calories').notNull(),
  protein: float('protein').notNull(),
  fat: float('fat').notNull(),
  carbs: float('carbs').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_meal_user_date').on(table.userId, table.date),
])

export const weightRecords = mysqlTable('weight_records', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  weight: float('weight').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_weight_user_date').on(table.userId, table.date),
])

export const refreshTokens = mysqlTable('refresh_tokens', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 500 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_refresh_user').on(table.userId),
])
