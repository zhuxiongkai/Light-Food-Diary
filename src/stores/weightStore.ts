import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/client'
import type { WeightRecord } from '@/types'

export const useWeightStore = defineStore('weight', () => {
  const records = ref<WeightRecord[]>([])
  const loading = ref(false)

  function todayStr() {
    const date = new Date()
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  async function loadRecords() {
    loading.value = true
    try {
      const res = await api<WeightRecord[]>('/weight')
      records.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function addRecord(weight: number, date?: string) {
    const res = await api<WeightRecord>('/weight', {
      method: 'POST',
      body: JSON.stringify({ weight, date: date || todayStr() }),
    })
    records.value.unshift(res.data)
    return res.data.id!
  }

  async function deleteRecord(id: number) {
    await api(`/weight/${id}`, { method: 'DELETE' })
    records.value = records.value.filter(r => r.id !== id)
  }

  async function getRecordsByDateRange(start: string, end: string): Promise<WeightRecord[]> {
    const res = await api<WeightRecord[]>(`/weight/range?start=${start}&end=${end}`)
    return res.data
  }

  return { records, loading, loadRecords, addRecord, deleteRecord, getRecordsByDateRange }
})
