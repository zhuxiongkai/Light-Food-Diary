import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db'
import type { WeightRecord } from '@/types'

export const useWeightStore = defineStore('weight', () => {
  const records = ref<WeightRecord[]>([])
  const loading = ref(false)

  function todayStr() {
    return new Date().toISOString().slice(0, 10)
  }

  async function loadRecords() {
    loading.value = true
    records.value = await db.weightRecords.orderBy('date').reverse().toArray()
    loading.value = false
  }

  async function addRecord(weight: number, date?: string) {
    const record: WeightRecord = {
      date: date || todayStr(),
      weight,
      createdAt: Date.now()
    }
    const id = await db.weightRecords.add(record)
    records.value.unshift({ ...record, id })
    return id
  }

  async function deleteRecord(id: number) {
    await db.weightRecords.delete(id)
    records.value = records.value.filter(r => r.id !== id)
  }

  async function getRecordsByDateRange(start: string, end: string): Promise<WeightRecord[]> {
    return db.weightRecords.where('date').between(start, end, true, true).toArray()
  }

  return { records, loading, loadRecords, addRecord, deleteRecord, getRecordsByDateRange }
})
