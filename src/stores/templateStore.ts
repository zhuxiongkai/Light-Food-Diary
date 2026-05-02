import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api/client'
import type { MealTemplate } from '@/types'

export const useTemplateStore = defineStore('template', () => {
  const templates = ref<MealTemplate[]>([])
  const loading = ref(false)

  async function loadTemplates() {
    loading.value = true
    try {
      const res = await api<MealTemplate[]>('/meals/templates')
      templates.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(data: Omit<MealTemplate, 'id' | 'createdAt'>) {
    const res = await api<MealTemplate>('/meals/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    templates.value.push(res.data)
    return res.data
  }

  async function updateTemplate(id: number, data: Partial<MealTemplate>) {
    await api(`/meals/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    const idx = templates.value.findIndex((t) => t.id === id)
    if (idx > -1) {
      templates.value[idx] = { ...templates.value[idx], ...data }
    }
  }

  async function deleteTemplate(id: number) {
    await api(`/meals/templates/${id}`, { method: 'DELETE' })
    templates.value = templates.value.filter((t) => t.id !== id)
  }

  async function applyTemplate(id: number, date: string, mealType?: string) {
    const res = await api(`/meals/templates/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify({ date, mealType }),
    })
    return res.data
  }

  return { templates, loading, loadTemplates, createTemplate, updateTemplate, deleteTemplate, applyTemplate }
})
