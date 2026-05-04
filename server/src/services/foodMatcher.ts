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
  // 主食
  { canonical: '米饭', aliases: ['白米饭', '米飯', '白饭', '白飯', '大米饭', '蒸米饭', '白米'] },
  { canonical: '白粥', aliases: ['稀饭', '大米粥', '粥', '白米粥', '米粥'] },
  { canonical: '小米粥', aliases: ['小米', '小米饭'] },
  { canonical: '面条(煮)', aliases: ['面条', '水煮面', '汤面', '拌面', '素面', '鸡蛋面', '捞面', '煮面条'] },
  { canonical: '方便面', aliases: ['泡面', '速食面', '即食面', '桶面', '杯面', '拉面泡面', '速泡面'] },
  { canonical: '饺子(猪肉)', aliases: ['水饺', '饺子', '蒸饺', '白饺', '猪肉饺子', '猪肉水饺'] },
  { canonical: '包子(猪肉)', aliases: ['包子', '猪肉包', '猪肉包子'] },
  { canonical: '馄饨', aliases: ['云吞', '抄手', '大馄饨', '小馄饨'] },
  { canonical: '糯米饭', aliases: ['糯米', '江米饭', '粽子糯米', '糯饭'] },
  { canonical: '炒饭', aliases: ['什锦炒饭'] },
  { canonical: '蛋炒饭', aliases: ['蛋炒米饭', '炒鸡蛋饭'] },
  { canonical: '牛肉面', aliases: ['红烧牛肉面', '兰州拉面', '兰州牛肉面', '清汤牛肉面'] },
  { canonical: '炒面', aliases: ['干炒面', '炒粉', '炒河粉'] },
  { canonical: '米粉(煮)', aliases: ['米粉', '米线', '细米粉', '过桥米线', '桂林米粉'] },
  { canonical: '春卷', aliases: ['炸春卷', '素春卷'] },
  { canonical: '锅贴', aliases: ['煎饺', '水煎包'] },
  { canonical: '烧麦', aliases: ['烧卖', '肉烧卖'] },

  // 肉类
  { canonical: '西红柿炒鸡蛋', aliases: ['番茄炒蛋', '番茄炒鸡蛋', '西红柿炒蛋', '西红柿蛋', '番茄蛋'] },
  { canonical: '西红柿', aliases: ['番茄', '圣女果', '小番茄', '大番茄'] },
  { canonical: '鸡肉(胸)', aliases: ['鸡胸', '鸡胸肉', '鸡扒', '鸡扒肉', '去皮鸡胸'] },
  { canonical: '鸡腿', aliases: ['鸡腿肉', '鸡大腿', '去骨鸡腿', '琵琶腿', '鸡棒腿'] },
  { canonical: '鸡翅', aliases: ['鸡翅膀', '鸡翅中', '翅膀', '鸡翅根', '鸡小翅'] },
  { canonical: '猪肉(瘦)', aliases: ['瘦肉', '猪瘦肉', '里脊肉', '猪里脊', '猪柳', '猪肉片', '猪肉丝'] },
  { canonical: '猪肉(五花)', aliases: ['五花肉', '腩肉', '花肉', '三层肉', '猪腩'] },
  { canonical: '猪排骨', aliases: ['排骨', '猪肋排', '肋排', '小排'] },
  { canonical: '牛肉(瘦)', aliases: ['牛肉', '瘦牛肉', '牛里脊', '牛柳', '牛肉片', '牛肉丝'] },
  { canonical: '羊肉', aliases: ['羊肉片', '涮羊肉', '手把羊肉'] },
  { canonical: '虾仁', aliases: ['虾', '大虾', '明虾', '对虾', '鲜虾', '白虾', '活虾', '鲜虾仁'] },
  { canonical: '基围虾', aliases: ['草虾', '海虾', '冻虾'] },
  { canonical: '小龙虾', aliases: ['龙虾', '麻辣小龙虾', '十三香小龙虾'] },
  { canonical: '草鱼', aliases: ['草鱼片', '草鱼块', '鱼片'] },
  { canonical: '带鱼', aliases: ['带鱼段', '秋刀鱼', '刀鱼'] },
  { canonical: '三文鱼', aliases: ['鲑鱼', '大马哈鱼', '生三文鱼'] },
  { canonical: '鱿鱼', aliases: ['炒鱿鱼', '烤鱿鱼', '鱿鱼须', '鱿鱼丝'] },

  // 蛋类
  { canonical: '鸡蛋', aliases: ['鸡蛋一个', '鸡蛋1个', '鸡蛋两个', '鲜鸡蛋', '土鸡蛋', '笨鸡蛋'] },
  { canonical: '煮鸡蛋', aliases: ['煮蛋', '白煮蛋', '溏心蛋', '水煮蛋', '全熟蛋', '温泉蛋'] },
  { canonical: '煎蛋', aliases: ['荷包蛋', '太阳蛋', '单面煎蛋', '双面煎蛋', '蛋包'] },
  { canonical: '蒸鸡蛋', aliases: ['蒸蛋', '鸡蛋羹', '水蒸蛋', '鸡蛋蒸'] },

  // 蔬菜
  { canonical: '豆腐', aliases: ['南豆腐', '北豆腐', '内酯豆腐', '绢豆腐', '嫩豆腐', '老豆腐', '软豆腐', '硬豆腐'] },
  { canonical: '豆芽', aliases: ['黄豆芽', '绿豆芽', '银芽', '豆芽菜'] },
  { canonical: '胡萝卜', aliases: ['红萝卜', '胡萝卜丝', '胡萝卜片', '甜萝卜'] },
  { canonical: '青椒', aliases: ['甜椒', '彩椒', '灯笼椒', '大椒', '菜椒', '柿子椒'] },
  { canonical: '白菜', aliases: ['大白菜', '包菜', '圆白菜', '卷心菜', '小白菜', '结球白菜'] },
  { canonical: '油菜', aliases: ['上海青', '青菜', '小油菜', '菜心', '奶油菜'] },
  { canonical: '生菜', aliases: ['罗马生菜', '球生菜', '奶油生菜', '西生菜', '散叶生菜'] },
  { canonical: '木耳', aliases: ['水发木耳', '干木耳', '黑木耳', '云耳', '木耳丝'] },
  { canonical: '香菇', aliases: ['冬菇', '花菇', '椎茸', '香蕈', '鲜香菇', '干香菇'] },
  { canonical: '金针菇', aliases: ['冬菇菇', '金针', '毛柄金钱菌'] },
  { canonical: '海带', aliases: ['海带丝', '裙带菜', '昆布', '海带结', '海带片'] },
  { canonical: '西兰花', aliases: ['绿花椰', '花椰菜', '绿花菜', '西蓝花'] },
  { canonical: '藕', aliases: ['莲藕', '藕片', '藕丝'] },
  { canonical: '西葫芦', aliases: ['角瓜', '美洲南瓜', '绿皮西葫芦'] },

  // 水果
  { canonical: '橙子', aliases: ['脐橙', '橙', '血橙', '甜橙', '赣南脐橙'] },
  { canonical: '橘子', aliases: ['橘', '蜜橘', '砂糖橘', '沙糖橘', '芦柑', '柑橘', '小橘子'] },
  { canonical: '猕猴桃', aliases: ['奇异果', '猕猴桃绿肉', '猕猴桃黄肉'] },
  { canonical: '葡萄', aliases: ['提子', '玫瑰葡萄', '无籽葡萄', '巨峰葡萄', '红提', '绿提'] },
  { canonical: '苹果', aliases: ['红苹果', '青苹果', '富士苹果', '苹果片'] },
  { canonical: '香蕉', aliases: ['芭蕉', '香蕉片', '小香蕉', '皇帝蕉'] },
  { canonical: '西瓜', aliases: ['西瓜片', '无籽西瓜', '小西瓜'] },
  { canonical: '芒果', aliases: ['小芒果', '台芒', '金煌芒果', '芒果肉'] },

  // 乳制品 / 饮品
  { canonical: '牛奶', aliases: ['全脂牛奶', '纯牛奶', '热牛奶', '鲜牛奶', '鲜奶', '低脂牛奶', '脱脂牛奶'] },
  { canonical: '酸奶', aliases: ['老酸奶', '希腊酸奶', '风味酸奶', '脱脂酸奶', '原味酸奶'] },
  { canonical: '豆浆', aliases: ['热豆浆', '无糖豆浆', '甜豆浆'] },
  { canonical: '椰汁', aliases: ['椰子汁', '椰子水', '新鲜椰汁'] },
  { canonical: '可乐', aliases: ['可口可乐', '百事可乐', '零度可乐', '无糖可乐'] },
  { canonical: '橙汁', aliases: ['鲜橙汁', '鲜榨橙汁', '纯橙汁'] },
  { canonical: '咖啡(黑)', aliases: ['黑咖啡', '美式咖啡', '无糖咖啡', '纯咖啡', '滴滤咖啡'] },
  { canonical: '拿铁咖啡', aliases: ['拿铁', '牛奶咖啡', '白咖啡', '卡布奇诺'] },
  { canonical: '绿茶', aliases: ['龙井', '碧螺春', '绿茶饮料', '无糖绿茶', '清茶'] },
  { canonical: '红茶', aliases: ['英式红茶', '普洱', '乌龙茶', '茶'] },

  // 常见菜品别名
  { canonical: '宫保鸡丁', aliases: ['宫爆鸡丁', '宫保鸡'] },
  { canonical: '鱼香肉丝', aliases: ['鱼香肉', '鱼香炒肉'] },
  { canonical: '红烧肉', aliases: ['东坡红烧肉', '梅干菜红烧肉', '扣肉'] },
  { canonical: '麻婆豆腐', aliases: ['麻辣豆腐', '麻婆'] },
  { canonical: '炸鸡', aliases: ['炸鸡块', '炸鸡腿', '炸鸡翅', '油炸鸡', '肯德基鸡', 'KFC炸鸡'] },
  { canonical: '糖醋里脊', aliases: ['糖醋猪肉', '糖醋肉'] },
  { canonical: '麻辣烫', aliases: ['冒菜', '串串香'] },
  { canonical: '腊肉', aliases: ['腊猪肉', '熏肉', '腊肉片', '湖南腊肉', '四川腊肉'] },
  { canonical: '午餐肉', aliases: ['午餐肉罐头', '火腿罐头', '猪肉罐头'] },
  { canonical: '火腿肠', aliases: ['玉米肠', '烤肠', '红肠', '香肠', '台湾烤肠'] },
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
