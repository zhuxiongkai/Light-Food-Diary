export type ServingUnit = '份' | '碗' | '个' | '杯' | '瓶' | '片' | '根'
type FoodCategory = 'staple' | 'meat' | 'vegetable' | 'fruit' | 'snack' | 'drink' | 'custom'

export interface ServingOption {
  label: string
  multiplier: number
  weight: number
}

export interface ServingProfile {
  defaultServingWeight: number
  servingUnit: ServingUnit
  servingOptions: ServingOption[]
}

interface ServingFoodLike {
  name: string
  category: string
}

interface ServingPreset {
  keywords: string[]
  weight: number
  unit: ServingUnit
}

const CATEGORY_DEFAULTS: Record<FoodCategory, { weight: number; unit: ServingUnit }> = {
  staple: { weight: 150, unit: '份' },
  meat: { weight: 150, unit: '份' },
  vegetable: { weight: 200, unit: '份' },
  fruit: { weight: 200, unit: '个' },
  snack: { weight: 50, unit: '份' },
  drink: { weight: 250, unit: '杯' },
  custom: { weight: 150, unit: '份' },
}

const SERVING_PRESETS: ServingPreset[] = [
  { keywords: ['米饭', '白米饭', '饭'], weight: 150, unit: '碗' },
  { keywords: ['粥', '小米粥', '白粥', '八宝粥', '皮蛋瘦肉粥'], weight: 300, unit: '碗' },
  { keywords: ['面条', '牛肉面', '炸酱面', '炒面', '凉皮'], weight: 400, unit: '碗' },
  { keywords: ['馒头', '包子', '花卷'], weight: 100, unit: '个' },
  { keywords: ['饺子', '馄饨', '烧麦'], weight: 200, unit: '份' },
  { keywords: ['鸡蛋', '煮鸡蛋', '茶叶蛋', '煎蛋', '鸭蛋', '鹌鹑蛋'], weight: 50, unit: '个' },
  { keywords: ['苹果', '梨', '桃子', '橙子', '芒果', '火龙果'], weight: 200, unit: '个' },
  { keywords: ['香蕉', '玉米', '红薯'], weight: 120, unit: '根' },
  { keywords: ['全麦面包', '白面包', '面包'], weight: 35, unit: '片' },
  { keywords: ['牛奶', '豆浆', '酸奶', '橙汁', '苹果汁', '可乐', '雪碧'], weight: 250, unit: '杯' },
  { keywords: ['奶茶', '运动饮料', '功能饮料'], weight: 500, unit: '杯' },
  { keywords: ['红烧肉', '回锅肉', '宫保鸡丁', '鱼香肉丝', '糖醋里脊', '麻婆豆腐'], weight: 180, unit: '份' },
  { keywords: ['西红柿炒鸡蛋', '番茄炒蛋', '西红柿炒蛋'], weight: 250, unit: '份' },
  { keywords: ['炒饭', '蛋炒饭'], weight: 300, unit: '份' },
  { keywords: ['火锅', '麻辣烫'], weight: 500, unit: '份' },
]

export function getServingProfile(food: ServingFoodLike): ServingProfile {
  const preset = findServingPreset(food.name)
  const fallback = CATEGORY_DEFAULTS[normalizeCategory(food.category)] ?? CATEGORY_DEFAULTS.custom
  const defaultServingWeight = preset?.weight ?? fallback.weight
  const servingUnit = preset?.unit ?? fallback.unit

  return {
    defaultServingWeight,
    servingUnit,
    servingOptions: [
      createServingOption('少量', 0.5, defaultServingWeight),
      createServingOption('标准', 1, defaultServingWeight),
      createServingOption('偏多', 1.5, defaultServingWeight),
    ],
  }
}

function findServingPreset(foodName: string) {
  const normalizedName = normalizeName(foodName)
  if (!normalizedName) return null

  return SERVING_PRESETS.find((preset) =>
    preset.keywords.some((keyword) => {
      const normalizedKeyword = normalizeName(keyword)
      return normalizedName === normalizedKeyword || normalizedName.includes(normalizedKeyword)
    })
  ) ?? null
}

function createServingOption(label: string, multiplier: number, baseWeight: number): ServingOption {
  return {
    label,
    multiplier,
    weight: Math.max(10, Math.round(baseWeight * multiplier)),
  }
}

function normalizeCategory(category: string): FoodCategory {
  return ['staple', 'meat', 'vegetable', 'fruit', 'snack', 'drink', 'custom'].includes(category)
    ? (category as FoodCategory)
    : 'custom'
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s·,，。！!？?()（）\-_/]/g, '')
    .trim()
}
