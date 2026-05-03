export type NutritionSource = 'food-db' | 'alias' | 'unknown'

export interface NutritionFood {
  id: number
  name: string
  category: string
  caloriesPer100g: number
  protein: number
  fat: number
  carbs: number
  isBuiltin: boolean
}

export interface RecognitionCandidate {
  foodName: string
  estimatedWeight: number
  estimatedCalories: number
  confidence: number
}

export interface EnrichedAiRecognitionResult extends RecognitionCandidate {
  matchedFoodId: number
  matchedFoodName: string
  protein: number
  fat: number
  carbs: number
  nutritionSource: NutritionSource
}

export interface FoodNutritionMatch {
  food: NutritionFood
  source: Exclude<NutritionSource, 'unknown'>
}

const FOOD_ALIASES: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: '米饭', aliases: ['白米饭', '米飯', '白饭', '白飯'] },
  { canonical: '西红柿炒鸡蛋', aliases: ['番茄炒蛋', '番茄炒鸡蛋', '西红柿炒蛋'] },
  { canonical: '鸡肉(胸)', aliases: ['鸡胸', '鸡胸肉'] },
  { canonical: '猪肉(瘦)', aliases: ['瘦肉', '猪瘦肉'] },
  { canonical: '猪肉(五花)', aliases: ['五花肉'] },
  { canonical: '牛肉(瘦)', aliases: ['牛肉', '瘦牛肉'] },
  { canonical: '面条(煮)', aliases: ['面条', '水煮面'] },
  { canonical: '鸡蛋', aliases: ['鸡蛋一个', '鸡蛋1个'] },
]

export function findFoodNutritionMatch(
  foodName: string,
  foods: NutritionFood[]
): FoodNutritionMatch | null {
  const normalized = normalizeName(foodName)
  if (!normalized) return null

  const exact = foods.find((food) => normalizeName(food.name) === normalized)
  if (exact) {
    return { food: exact, source: 'food-db' }
  }

  const aliasCanonical = findAliasCanonicalName(normalized)
  if (aliasCanonical) {
    const aliasMatch = findByNormalizedName(aliasCanonical, foods)
    if (aliasMatch) {
      return { food: aliasMatch, source: 'alias' }
    }
  }

  const fuzzy = foods.find((food) => {
    const normalizedFoodName = normalizeName(food.name)
    if (normalizedFoodName.length < 2 || normalized.length < 2) return false
    return normalizedFoodName.includes(normalized) || normalized.includes(normalizedFoodName)
  })

  return fuzzy ? { food: fuzzy, source: 'food-db' } : null
}

export function enrichRecognitionWithNutrition(
  item: RecognitionCandidate,
  foods: NutritionFood[]
): EnrichedAiRecognitionResult {
  const match = findFoodNutritionMatch(item.foodName, foods)
  if (!match) {
    return {
      ...item,
      matchedFoodId: 0,
      matchedFoodName: '',
      protein: 0,
      fat: 0,
      carbs: 0,
      nutritionSource: 'unknown',
    }
  }

  return {
    ...item,
    matchedFoodId: match.food.id,
    matchedFoodName: match.food.name,
    estimatedCalories: match.food.caloriesPer100g,
    protein: match.food.protein,
    fat: match.food.fat,
    carbs: match.food.carbs,
    nutritionSource: match.source,
  }
}

function findAliasCanonicalName(normalizedFoodName: string) {
  const alias = FOOD_ALIASES.find((entry) =>
    entry.aliases.some((candidate) => {
      const normalizedAlias = normalizeName(candidate)
      return normalizedFoodName === normalizedAlias || normalizedFoodName.includes(normalizedAlias)
    })
  )

  return alias ? normalizeName(alias.canonical) : null
}

function findByNormalizedName(normalizedFoodName: string, foods: NutritionFood[]) {
  return foods.find((food) => normalizeName(food.name) === normalizedFoodName) ?? null
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s·,，。！!？?()（）\-_/]/g, '')
    .trim()
}
