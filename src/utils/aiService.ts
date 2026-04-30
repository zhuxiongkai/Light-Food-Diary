// AI food recognition service using Claude Vision API

import type { AiRecognitionResult } from '@/types'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>
}

export async function analyzeFoodImage(
  imageBase64: string,
  mediaType: string,
  apiKey: string
): Promise<AiRecognitionResult[]> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
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
                data: imageBase64
              }
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
[{"foodName": "米饭", "estimatedWeight": 150, "estimatedCalories": 174, "confidence": 0.9}]`
            }
          ]
        }
      ]
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI识别失败: ${response.status} ${err}`)
  }

  const data: ClaudeResponse = await response.json()
  const text = data.content[0]?.text || ''

  // Extract JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) {
    throw new Error('AI返回格式异常，请重试')
  }

  const results: AiRecognitionResult[] = JSON.parse(jsonMatch[0])
  return results
}
