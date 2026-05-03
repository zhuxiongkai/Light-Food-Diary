import { AppError } from '../middleware/errorHandler.js'
import { config } from '../config.js'
import { getMealsByDateRange } from './mealService.js'
import { getSettings } from './settingsService.js'

const BAIDU_TOKEN_API_URL = 'https://aip.baidubce.com/oauth/2.0/token'
const BAIDU_DISH_API_URL = 'https://aip.baidubce.com/rest/2.0/image-classify/v2/dish'
const DEFAULT_WEIGHT_GRAMS = 100
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000

interface AiRecognitionResult {
  foodName: string
  estimatedWeight: number
  estimatedCalories: number
  confidence: number
}

interface BaiduAccessTokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface BaiduDishItem {
  name?: string
  probability?: number
  calorie?: string | number
  has_calorie?: boolean | number
}

interface BaiduDishResponse {
  error_code?: number
  error_msg?: string
  result?: BaiduDishItem[]
}

let accessTokenCache: { value: string; expiresAt: number } | null = null

function parseCalories(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    return Math.round(raw)
  }

  if (typeof raw === 'string') {
    const match = raw.match(/\d+(\.\d+)?/)
    if (!match) return 0
    const num = Number(match[0])
    if (Number.isFinite(num) && num >= 0) {
      return Math.round(num)
    }
  }

  return 0
}

function normalizeConfidence(raw: unknown): number {
  const numeric = Number(raw)
  if (!Number.isFinite(numeric)) return 0
  if (numeric > 1) return Math.min(1, numeric / 100)
  if (numeric < 0) return 0
  return numeric
}

function toAiResultArray(items: BaiduDishItem[]): AiRecognitionResult[] {
  return items
    .map((item) => {
      const foodName = String(item.name || '').trim()
      const confidence = normalizeConfidence(item.probability)
      const hasCalorie = item.has_calorie === true || Number(item.has_calorie) === 1
      const estimatedCalories = hasCalorie ? parseCalories(item.calorie) : 0

      return {
        foodName,
        // 百度接口返回的是参考卡路里，不包含份量，统一按 100g 返回给前端继续调整。
        estimatedWeight: DEFAULT_WEIGHT_GRAMS,
        estimatedCalories,
        confidence,
      }
    })
    .filter((item) => !!item.foodName && item.confidence > 0)
}

async function getBaiduAccessToken(): Promise<string> {
  if (
    accessTokenCache &&
    accessTokenCache.expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()
  ) {
    return accessTokenCache.value
  }

  if (!config.baiduAi.apiKey || !config.baiduAi.secretKey) {
    throw new AppError('服务端未配置百度AI密钥，请在 server/.env 中设置', 500)
  }

  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.baiduAi.apiKey,
    client_secret: config.baiduAi.secretKey,
  })

  const tokenResponse = await fetch(BAIDU_TOKEN_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
  })

  if (!tokenResponse.ok) {
    throw new AppError(`获取百度访问令牌失败: ${tokenResponse.status}`, 502)
  }

  const tokenData: BaiduAccessTokenResponse = await tokenResponse.json()
  if (!tokenData.access_token) {
    const errorMessage = tokenData.error_description || tokenData.error || 'unknown error'
    throw new AppError(`获取百度访问令牌失败: ${errorMessage}`, 502)
  }

  const expiresIn = Number(tokenData.expires_in)
  const expiresAt = Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 2592000) * 1000
  accessTokenCache = { value: tokenData.access_token, expiresAt }
  return tokenData.access_token
}

export async function recognizeFood(
  _userId: number,
  imageBase64: string,
  _mediaType: string
): Promise<AiRecognitionResult[]> {
  const accessToken = await getBaiduAccessToken()

  const requestBody = new URLSearchParams({
    image: imageBase64,
    top_num: '5',
  })

  const response = await fetch(`${BAIDU_DISH_API_URL}?access_token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody.toString(),
  })

  if (!response.ok) {
    throw new AppError(`百度识别失败: ${response.status}`, 502)
  }

  const data: BaiduDishResponse = await response.json()
  if (data.error_code) {
    throw new AppError(`百度识别失败: ${data.error_msg || data.error_code}`, 502)
  }

  if (!Array.isArray(data.result)) {
    throw new AppError('百度返回格式异常，请重试', 500)
  }

  const normalized = toAiResultArray(data.result)
  if (normalized.length === 0) {
    throw new AppError('未识别到有效菜品，请换个角度再试', 500)
  }

  return normalized
}

const DEEPSEEK_CHAT_PATH = '/chat/completions'

export interface DailyNutritionSnapshot {
  date: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

function formatDateYMD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getLastNDaysRangeInclusive(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  return { start: formatDateYMD(start), end: formatDateYMD(end) }
}

function enumerateDatesInclusive(start: string, end: string): string[] {
  const result: string[] = []
  const cursor = new Date(`${start}T12:00:00`)
  const last = new Date(`${end}T12:00:00`)
  while (cursor <= last) {
    result.push(formatDateYMD(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

function aggregateDailyMeals(
  meals: Awaited<ReturnType<typeof getMealsByDateRange>>,
  start: string,
  end: string
): DailyNutritionSnapshot[] {
  const dates = enumerateDatesInclusive(start, end)
  const map = new Map<string, DailyNutritionSnapshot>()
  for (const date of dates) {
    map.set(date, { date, calories: 0, protein: 0, fat: 0, carbs: 0 })
  }
  for (const m of meals) {
    const bucket = map.get(m.date)
    if (!bucket) continue
    bucket.calories += m.calories
    bucket.protein += m.protein
    bucket.fat += m.fat
    bucket.carbs += m.carbs
  }
  return dates.map((d) => map.get(d)!)
}

interface DeepSeekChatResponse {
  choices?: Array<{ message?: { content?: string } }>
  error?: { message?: string }
}

export async function generateNutritionAdvice(userId: number): Promise<string> {
  if (!config.deepseek.apiKey) {
    throw new AppError('服务端未配置 DeepSeek API 密钥，请在 server/.env 中设置 DEEPSEEK_API_KEY', 500)
  }

  const settings = await getSettings(userId)
  const { start, end } = getLastNDaysRangeInclusive(7)
  const meals = await getMealsByDateRange(userId, start, end)
  const daily = aggregateDailyMeals(meals, start, end)

  const totalCalories = daily.reduce((s, d) => s + d.calories, 0)
  if (totalCalories <= 0) {
    return '近 7 天暂无饮食记录。请先在「记录」页添加餐食，积累数据后即可生成个性化建议。'
  }

  const avgDaily = {
    calories: Math.round(totalCalories / 7),
    protein: Math.round(daily.reduce((s, d) => s + d.protein, 0) / 7),
    fat: Math.round(daily.reduce((s, d) => s + d.fat, 0) / 7),
    carbs: Math.round(daily.reduce((s, d) => s + d.carbs, 0) / 7),
  }

  const proteinCal = daily.reduce((s, d) => s + d.protein * 4, 0)
  const fatCal = daily.reduce((s, d) => s + d.fat * 9, 0)
  const carbsCal = daily.reduce((s, d) => s + d.carbs * 4, 0)
  const macroDen = proteinCal + fatCal + carbsCal
  const macroPct =
    macroDen > 0
      ? {
          protein: Math.round((proteinCal / macroDen) * 100),
          fat: Math.round((fatCal / macroDen) * 100),
          carbs: Math.round((carbsCal / macroDen) * 100),
        }
      : { protein: 0, fat: 0, carbs: 0 }

  const mid = Math.floor(daily.length / 2)
  const firstHalf = daily.slice(0, mid)
  const secondHalf = daily.slice(mid)
  const avg = (arr: DailyNutritionSnapshot[], key: keyof DailyNutritionSnapshot) =>
    arr.length === 0
      ? 0
      : Math.round(arr.reduce((s, d) => s + (d[key] as number), 0) / arr.length)
  const trendHint = {
    caloriesFirstHalf: avg(firstHalf, 'calories'),
    caloriesSecondHalf: avg(secondHalf, 'calories'),
    deltaPercent:
      avg(firstHalf, 'calories') > 0
        ? Math.round(
            ((avg(secondHalf, 'calories') - avg(firstHalf, 'calories')) / avg(firstHalf, 'calories')) * 100
          )
        : null,
  }

  const payload = {
    period: { start, end, days: 7 },
    userTargets: {
      dailyCalorieGoal: settings.dailyCalorieGoal,
      proteinRatio: settings.proteinRatio,
      fatRatio: settings.fatRatio,
      carbsRatio: settings.carbsRatio,
      weightKg: settings.weight,
    },
    dailyBreakdown: daily,
    averages7d: avgDaily,
    macroPercentByCalories7d: macroPct,
    trendComparison: trendHint,
  }

  const systemPrompt =
    '你是膳食分析助手，面向中文用户，输出非医疗建议。根据近 7 天记录与目标，写极简结论。' +
    '输出必须是 Markdown：仅用三个二级标题「蛋白质」「碳水与脂肪」「趋势」，每个标题下用 1～2 条无序列表（每条一句话），可加粗关键词。**全文不超过 220 字**，勿寒暄、勿重复数据表格，勿编造记录中没有的信息。'

  const userPrompt = `以下为 JSON 数据，请按上述 Markdown 结构输出：\n${JSON.stringify(payload)}`

  const url = `${config.deepseek.baseUrl}${DEEPSEEK_CHAT_PATH}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.deepseek.apiKey}`,
    },
    body: JSON.stringify({
      model: config.deepseek.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 450,
    }),
  })

  const raw: DeepSeekChatResponse = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg = raw.error?.message || `HTTP ${response.status}`
    throw new AppError(`DeepSeek 请求失败: ${msg}`, 502)
  }

  const text = raw.choices?.[0]?.message?.content?.trim()
  if (!text) {
    throw new AppError('DeepSeek 返回内容为空', 502)
  }

  return text
}
