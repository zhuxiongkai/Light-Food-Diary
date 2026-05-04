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
  { canonical: '米饭', aliases: ['白米饭', '米飯', '白饭', '白飯', '蒸米饭', '大米饭', '白米', '米'] },
  { canonical: '西红柿炒鸡蛋', aliases: ['番茄炒蛋', '番茄炒鸡蛋', '西红柿炒蛋', '鸡蛋炒番茄', '鸡蛋炒西红柿'] },
  { canonical: '鸡肉(胸)', aliases: ['鸡胸', '鸡胸肉', '鸡肉', '白切鸡胸', '无骨鸡胸', '鸡柳'] },
  { canonical: '猪肉(瘦)', aliases: ['瘦肉', '猪瘦肉', '里脊肉', '猪里脊', '猪肉片', '瘦猪肉'] },
  { canonical: '猪肉(五花)', aliases: ['五花肉', '三层肉', '带皮猪肉'] },
  { canonical: '牛肉(瘦)', aliases: ['牛肉', '瘦牛肉', '牛里脊', '黄牛肉', '嫩牛肉', '牛肉片'] },
  { canonical: '面条(煮)', aliases: ['面条', '水煮面', '手擀面', '拉条', '碱面', '素面', '汤面条'] },
  { canonical: '鸡蛋', aliases: ['鸡蛋一个', '鸡蛋1个', '整蛋', '全蛋'] },
  { canonical: '猪排骨', aliases: ['排骨', '猪排', '小排', '肋排', '猪肋排', '猪小排'] },
  { canonical: '基围虾', aliases: ['虾', '对虾', '大虾', '明虾', '海虾', '河虾'] },
  { canonical: '草鱼', aliases: ['鱼', '淡水鱼', '白鱼'] },
  { canonical: '西红柿', aliases: ['番茄', '圣女果', '小番茄', '小西红柿'] },
  { canonical: '菜花', aliases: ['花菜', '花椰菜', '白花菜', '椰花菜'] },
  { canonical: '藕', aliases: ['莲藕', '莲节', '藕片'] },
  { canonical: '红薯', aliases: ['番薯', '地瓜', '红苕', '山芋', '甘薯', '紫薯'] },
  { canonical: '白菜', aliases: ['大白菜', '黄芽菜', '娃娃菜', '小白菜'] },
  { canonical: '卷心菜', aliases: ['包菜', '圆白菜', '洋白菜', '高丽菜', '甘蓝', '卷包菜'] },
  { canonical: '煎蛋', aliases: ['荷包蛋', '太阳蛋', '单面煎蛋', '双面煎蛋', '溏心荷包蛋'] },
  { canonical: '煮鸡蛋', aliases: ['水煮蛋', '溏心蛋', '溏心鸡蛋', '卤蛋', '茶蛋'] },
  { canonical: '白粥', aliases: ['粥', '大米粥', '稀饭', '白米粥', '原味粥', '清粥'] },
  { canonical: '包子(猪肉)', aliases: ['包子', '猪肉包', '小笼包', '肉包子', '猪肉包子', '灌汤包', '肉包'] },
  { canonical: '饺子(猪肉)', aliases: ['饺子', '蒸饺', '水饺', '煎饺'] },
  { canonical: '猪蹄', aliases: ['猪手', '猪脚', '红烧猪蹄', '猪蹄膀', '蹄髈'] },
  { canonical: '鸡腿', aliases: ['炸鸡腿', '烤鸡腿', '卤鸡腿', '鸡大腿', '琵琶腿'] },
  { canonical: '鸡翅', aliases: ['炸鸡翅', '烤鸡翅', '可乐鸡翅中', '鸡中翅', '翅中'] },
  { canonical: '牛腩', aliases: ['红烧牛肉', '炖牛肉', '牛腩肉'] },
  { canonical: '烤鸭', aliases: ['北京烤鸭', '烤鸭腿', '片皮鸭'] },
  { canonical: '挂面', aliases: ['方便面', '泡面', '速食面', '即食面', '拉面(方便面)', '拉面干'] },
  { canonical: '馒头', aliases: ['白馒头', '戗面馒头', '刀切馒头', '大馒头'] },
  { canonical: '鸡肝', aliases: ['鸡内脏', '鸡杂', '鸡心'] },
  { canonical: '猪肝', aliases: ['猪内脏', '熘肝尖', '爆炒猪肝'] },
  { canonical: '豆腐', aliases: ['嫩豆腐', '软豆腐', '内酯豆腐', '日本豆腐', '卤水豆腐', '北豆腐'] },
  { canonical: '三文鱼', aliases: ['鲑鱼', '熏鲑鱼', '生鱼片(三文鱼)'] },
  { canonical: '鱿鱼', aliases: ['炒鱿鱼', '爆炒鱿鱼', '鱿鱼圈', '烤鱿鱼'] },
  { canonical: '螃蟹', aliases: ['炒蟹', '蟹', '青蟹'] },
  { canonical: '燕麦片', aliases: ['燕麦', '麦片', '即食燕麦', '纯燕麦'] },
  { canonical: '玉米', aliases: ['甜玉米', '玉米棒', '煮玉米', '甜糯玉米', '糯玉米'] },
  { canonical: '土豆', aliases: ['马铃薯', '洋芋', '土豆片', '薯仔'] },
  { canonical: '南瓜', aliases: ['金瓜', '栗面南瓜', '贝贝南瓜', '糖南瓜'] },
  { canonical: '麻婆豆腐', aliases: ['麻辣豆腐', '豆腐煮肉末'] },
  { canonical: '宫保鸡丁', aliases: ['宫爆鸡丁', '宫保鸡', '宫爆鸡'] },
  { canonical: '红烧肉', aliases: ['红烧五花肉', '扣肉', '毛氏红烧肉', '东坡肉'] },
  { canonical: '水煮鱼', aliases: ['沸腾鱼', '麻辣水煮鱼'] },
  { canonical: '蛋炒饭', aliases: ['炒蛋饭', '鸡蛋炒饭', '扬州炒饭'] },
  { canonical: '炒面', aliases: ['炒菜面', '干炒面'] },
  { canonical: '麻辣烫', aliases: ['串串香', '冒菜', '冒烫'] },
  { canonical: '牛肉面', aliases: ['红烧牛肉面', '清炖牛肉面', '兰州拉面', '拉面', '汤面', '兰州牛肉面'] },
  { canonical: '炒饭', aliases: ['米饭炒', '什锦炒饭'] },
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
