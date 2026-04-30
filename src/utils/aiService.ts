// AI food recognition — calls backend API instead of directly calling Claude
import { api } from '@/api/client'
import type { AiRecognitionResult } from '@/types'

export async function analyzeFoodImage(
  imageBase64: string,
  mediaType: string
): Promise<AiRecognitionResult[]> {
  const res = await api<AiRecognitionResult[]>('/ai/recognize', {
    method: 'POST',
    body: JSON.stringify({ imageBase64, mediaType }),
  })
  return res.data
}
