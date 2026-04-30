import type { MealRecord, WeightRecord } from '@/types'

export function exportToJSON(meals: MealRecord[], weights: WeightRecord[]) {
  const data = { meals, weights, exportDate: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `calorie-data-${new Date().toISOString().slice(0, 10)}.json`)
}

export function exportToCSV(meals: MealRecord[]) {
  const headers = ['日期', '餐别', '食物', '重量(g)', '热量(kcal)', '蛋白质(g)', '脂肪(g)', '碳水(g)']
  const typeLabels: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
  const rows = meals.map(m => [
    m.date,
    typeLabels[m.mealType] || m.mealType,
    m.foodName,
    m.weight,
    m.calories,
    m.protein,
    m.fat,
    m.carbs
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const bom = '﻿'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `calorie-data-${new Date().toISOString().slice(0, 10)}.csv`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
