import type { ActivityLevel, CalorieGoalMode } from '../types/index.ts'

export interface BodyProfile {
  gender: 'male' | 'female'
  weight: number
  height: number
  age: number
}

export interface ActivityProfile extends BodyProfile {
  activityLevel: ActivityLevel
}

export interface CalorieTargetProfile extends ActivityProfile {
  calorieGoalMode: CalorieGoalMode
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
}

const GOAL_OFFSETS: Record<CalorieGoalMode, number> = {
  maintain: 0,
  fat_loss: -400,
  muscle_gain: 250,
}

export function calculateBmr(profile: BodyProfile): number {
  const genderOffset = profile.gender === 'male' ? 5 : -161
  return Math.round((10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + genderOffset)
}

export function calculateTdee(profile: ActivityProfile): number {
  return Math.round(calculateBmr(profile) * ACTIVITY_FACTORS[profile.activityLevel])
}

export function calculateDailyCalorieTarget(profile: CalorieTargetProfile): number {
  return Math.max(800, Math.round(calculateTdee(profile) + GOAL_OFFSETS[profile.calorieGoalMode]))
}

export function calculateBmi(profile: Pick<BodyProfile, 'weight' | 'height'>): number {
  const heightMeters = profile.height / 100
  if (!Number.isFinite(heightMeters) || heightMeters <= 0) return 0
  return Math.round((profile.weight / (heightMeters * heightMeters)) * 10) / 10
}

export function calculateAbsorptionCoefficient(profile: Pick<BodyProfile, 'weight' | 'height'>): number {
  const bmi = calculateBmi(profile)
  if (bmi <= 0) return 1
  if (bmi < 18.5) return 1.13
  if (bmi < 24) return 1
  if (bmi < 28) return 0.93
  return 0.83
}

export function personalizeCalories(
  calories: number,
  profile: Pick<BodyProfile, 'weight' | 'height'>
): number {
  return Math.round(calories * calculateAbsorptionCoefficient(profile))
}
