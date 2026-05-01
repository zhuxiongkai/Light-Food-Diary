import { AppError } from '../middleware/errorHandler.js'
import { config } from '../config.js'

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
