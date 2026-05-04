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
  { canonical: '米饭', aliases: ['白米饭', '米飯', '白饭', '白飯', '白米', '米饭饭'] },
  { canonical: '西红柿炒鸡蛋', aliases: ['番茄炒蛋', '番茄炒鸡蛋', '西红柿炒蛋', '番茄鸡蛋', '番茄炒鸡蛋块'] },
  { canonical: '清炒青菜', aliases: ['炒青菜', '清炒时蔬', '炒时蔬', '炒油菜'] },
  { canonical: '油菜', aliases: ['青菜', '小青菜', '上海青', '小白菜'] },
  { canonical: '鸡肉(胸)', aliases: ['鸡胸', '鸡胸肉', '鸡胸脯肉'] },
  { canonical: '猪肉(瘦)', aliases: ['瘦肉', '猪瘦肉'] },
  { canonical: '猪肉(五花)', aliases: ['五花肉'] },
  { canonical: '牛肉(瘦)', aliases: ['牛肉', '瘦牛肉'] },
  { canonical: '面条(煮)', aliases: ['面条', '水煮面', '汤面', '素面'] },
  { canonical: '鸡蛋', aliases: ['鸡蛋一个', '鸡蛋1个', '水煮蛋', '白煮蛋'] },
  { canonical: '馄饨', aliases: ['云吞', '抄手', '小馄饨'] },
  { canonical: '包子(猪肉)', aliases: ['肉包', '肉包子', '包子'] },
  { canonical: '饺子(猪肉)', aliases: ['水饺', '肉饺子', '饺子'] },
  { canonical: '米线', aliases: ['过桥米线', '云南米线'] },
  { canonical: '河粉', aliases: ['炒河粉', '汤河粉'] },
  { canonical: '酸辣粉', aliases: ['重庆酸辣粉'] },
  { canonical: '螺蛳粉', aliases: ['柳州螺蛳粉'] },
  { canonical: '热干面', aliases: ['武汉热干面'] },
  { canonical: '凉面', aliases: ['冷面', '拌凉面'] },
  { canonical: '兰州拉面', aliases: ['牛肉拉面', '拉面'] },
  { canonical: '重庆小面', aliases: ['小面', '麻辣小面'] },
  { canonical: '小笼包', aliases: ['小笼包子', '小笼'] },
  { canonical: '肠粉', aliases: ['广东肠粉', '鸡蛋肠粉'] },
  { canonical: '肉夹馍', aliases: ['肉夹馍饼'] },
  { canonical: '手抓饼', aliases: ['台湾手抓饼'] },
  { canonical: '鸡蛋灌饼', aliases: ['灌饼'] },
  { canonical: '鸡排', aliases: ['炸鸡排', '大鸡排', '鸡柳'] },
  { canonical: '炸鸡', aliases: ['炸鸡块', '炸鸡腿', '炸鸡翅'] },
  { canonical: '汉堡', aliases: ['汉堡包', '牛肉汉堡', '鸡腿堡'] },
  { canonical: '披萨', aliases: ['比萨', 'pizza'] },
  { canonical: '三明治', aliases: ['三文治', 'sandwich'] },
  { canonical: '寿司', aliases: ['寿司卷'] },
  { canonical: '沙拉', aliases: ['蔬菜沙拉', '生菜沙拉'] },
  { canonical: '薯条', aliases: ['炸薯条'] },
  { canonical: '清蒸鱼', aliases: ['蒸鱼'] },
  { canonical: '红烧鱼', aliases: ['烧鱼'] },
  { canonical: '白灼虾', aliases: ['白灼基围虾', '水煮虾'] },
  { canonical: '土豆炖牛肉', aliases: ['牛肉炖土豆'] },
  { canonical: '青椒肉丝', aliases: ['青椒炒肉丝'] },
  { canonical: '尖椒炒肉', aliases: ['辣椒炒肉', '青椒炒肉'] },
  { canonical: '黄焖鸡米饭', aliases: ['黄焖鸡'] },
  { canonical: '咖喱鸡饭', aliases: ['咖喱鸡', '咖喱鸡肉饭'] },
  { canonical: '卤肉饭', aliases: ['台式卤肉饭'] },
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
