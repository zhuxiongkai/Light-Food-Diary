import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/mysql2'
import { pool } from '../db/connection.js'
import { userSettings } from '../db/schema.js'
import { decrypt } from '../utils/crypto.js'
import { AppError } from '../middleware/errorHandler.js'

const db = drizzle(pool)

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

interface AiRecognitionResult {
  foodName: string
  estimatedWeight: number
  estimatedCalories: number
  confidence: number
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>
}

export async function recognizeFood(
  userId: number,
  imageBase64: string,
  mediaType: string
): Promise<AiRecognitionResult[]> {
  // Get user's API key
  const [settings] = await db
    .select({ aiApiKey: userSettings.aiApiKey })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1)

  const apiKey = settings?.aiApiKey ? decrypt(settings.aiApiKey) : ''

  if (!apiKey) {
    throw new AppError('请先在设置中配置AI API Key', 400)
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `请分析这张食物图片，识别出所有食物并估算热量。

请以严格的JSON数组格式返回，每个食物包含以下字段：
- foodName: 食物名称（中文）
- estimatedWeight: 估算重量（克）
- estimatedCalories: 估算热量（千卡）
- confidence: 置信度（0-1之间的数字）

只返回JSON数组，不要添加任何其他文字。

示例格式：
[{"foodName": "米饭", "estimatedWeight": 150, "estimatedCalories": 174, "confidence": 0.9}]`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new AppError(`AI识别失败: ${response.status}`, 502)
  }

  const data: ClaudeResponse = await response.json()
  const text = data.content[0]?.text || ''

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new AppError('AI返回格式异常，请重试', 500)
  }

  return JSON.parse(jsonMatch[0])
}
