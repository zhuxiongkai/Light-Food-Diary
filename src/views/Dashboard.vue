<template>
  <div class="page dashboard-page">
    <div class="page-header dashboard-header">
      <div class="header-left">
        <h1 class="page-title">今日摄入</h1>
        <div class="date-info">
          <van-icon name="calendar-o" />
          <span>{{ fullDate }}</span>
        </div>
      </div>
      <!-- <button class="avatar-circle" type="button" aria-label="进入设置" @click="router.push('/settings')">
        <van-icon name="contact" />
      </button> -->
    </div>

    <section class="card summary-card stagger-1">
      <div class="ring-zone">
        <CalorieRing
          :current="Math.round(mealStore.dailyCalories)"
          :goal="settings.dailyCalorieGoal"
          :size="140"
          :show-percent="false"
          :show-goal="false"
        />
        <p class="ring-foot numeric">{{ consumedPercent }}%</p>
      </div>

      <div class="summary-info">
        <div class="target-head">
          <span class="target-label">今日目标</span>
          <button class="target-value numeric" type="button" @click="goToSettingsEdit('calorie')">
            {{ settings.dailyCalorieGoal }}
            <span>千卡</span>
            <van-icon name="edit" class="target-edit" />
          </button>
        </div>

        <div class="summary-stats">
          <div class="summary-item">
            <span class="dot remain-dot"></span>
            <span class="item-label">还可摄入</span>
            <span class="item-value numeric">{{ Math.max(remaining, 0) }} <span>千卡</span></span>
          </div>
        </div>
      </div>
    </section>

    <section class="meal-panel stagger-2">
      <div class="section-head meal-head">
        <h2 class="section-title">今日餐食</h2>
        <span class="section-note">建议分配 {{ settings.dailyCalorieGoal }} 千卡</span>
      </div>

      <div class="meal-list">
        <article
          v-for="meal in mealDistribution"
          :key="meal.type"
          class="meal-item"
          @click="goToMealLog(meal.type)"
        >
          <div class="meal-item-left">
            <div class="meal-icon" :class="`meal-icon-${meal.type}`">{{ meal.emoji }}</div>
            <div class="meal-main">
              <p class="meal-name">{{ meal.label }}</p>
              <p class="meal-calories numeric">{{ meal.calories }} <span>千卡</span></p>
              <p class="meal-range">建议 {{ meal.hint }}</p>
            </div>
          </div>

          <div class="meal-right">
            <div class="food-stack" v-if="meal.previewFoods.length > 0">
              <div
                v-for="(food, foodIndex) in meal.previewFoods"
                :key="`${meal.type}-${food.name}-${foodIndex}`"
                class="food-thumb"
                :title="food.name"
              >
                <span>{{ food.emoji }}</span>
              </div>
            </div>
            <span v-else class="food-empty">暂无记录</span>
            <div class="meal-chevron">
              <van-icon name="arrow" />
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="card macro-card stagger-3">
      <div class="section-head">
        <h2 class="section-title">三大营养素</h2>
        <button class="detail-link" type="button" @click="router.push('/statistics')">详情 <van-icon name="arrow" /></button>
      </div>

      <div class="macro-grid">
        <div class="macro-col protein-col">
          <p class="macro-label"><van-icon name="fire-o" /> 蛋白质</p>
          <p class="macro-value numeric">{{ formatTwo(mealStore.dailyProtein) }} <span>/ {{ macroGoals.protein }} g</span></p>
          <div class="mini-progress"><span :style="{ width: boundedPercent(proteinPercent) + '%' }"></span></div>
          <p class="macro-rate numeric">{{ proteinPercent }}%</p>
        </div>

        <div class="macro-col carbs-col">
          <p class="macro-label"><van-icon name="bar-chart-o" /> 碳水化合物</p>
          <p class="macro-value numeric">{{ formatTwo(mealStore.dailyCarbs) }} <span>/ {{ macroGoals.carbs }} g</span></p>
          <div class="mini-progress"><span :style="{ width: boundedPercent(carbsPercent) + '%' }"></span></div>
          <p class="macro-rate numeric">{{ carbsPercent }}%</p>
        </div>

        <div class="macro-col fat-col">
          <p class="macro-label"><van-icon name="flower-o" /> 脂肪</p>
          <p class="macro-value numeric">{{ formatTwo(mealStore.dailyFat) }} <span>/ {{ macroGoals.fat }} g</span></p>
          <div class="mini-progress"><span :style="{ width: boundedPercent(fatPercent) + '%' }"></span></div>
          <p class="macro-rate numeric">{{ fatPercent }}%</p>
        </div>
      </div>
    </section>

    <section v-if="showTip" class="tip-strip stagger-4">
      <div class="tip-icon"><van-icon name="bulb-o" /></div>
      <p>小贴士：今天还可以摄入 {{ Math.max(remaining, 0) }} 千卡，建议优先选择高蛋白、低脂食物。</p>
      <button class="tip-close" type="button" aria-label="关闭小贴士" @click="showTip = false">
        <van-icon name="cross" />
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMealStore } from '@/stores/mealStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { MEAL_TYPE_LABELS, type MealType } from '@/types'
import CalorieRing from '@/components/CalorieRing.vue'

const mealStore = useMealStore()
const settingsStore = useSettingsStore()
const router = useRouter()

const currentDate = ref(new Date())
const showTip = ref(true)

const settings = computed(() => settingsStore.settings)

const fullDate = computed(() => {
  const date = currentDate.value
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()]
  return `${year}年${month}月${day}日 ${weekday}`
})

const remaining = computed(() => settings.value.dailyCalorieGoal - Math.round(mealStore.dailyCalories))
const consumedPercent = computed(() => {
  const goal = Math.max(settings.value.dailyCalorieGoal, 1)
  return Math.max(0, Math.min(100, Math.round((mealStore.dailyCalories / goal) * 100)))
})

const macroGoals = computed(() => {
  const s = settings.value
  const cal = Math.max(s.dailyCalorieGoal, 1)
  return {
    protein: Math.max(1, Math.round(cal * s.proteinRatio / 100 / 4)),
    fat: Math.max(1, Math.round(cal * s.fatRatio / 100 / 9)),
    carbs: Math.max(1, Math.round(cal * s.carbsRatio / 100 / 4))
  }
})

const proteinPercent = computed(() => Math.round((mealStore.dailyProtein / macroGoals.value.protein) * 100))
const carbsPercent = computed(() => Math.round((mealStore.dailyCarbs / macroGoals.value.carbs) * 100))
const fatPercent = computed(() => Math.round((mealStore.dailyFat / macroGoals.value.fat) * 100))

const foodEmojiRules: Array<{ keys: string[]; emoji: string }> = [
  { keys: ['鸡蛋', '蛋'], emoji: '🥚' },
  { keys: ['米饭', '米', '粥', '饭'], emoji: '🍚' },
  { keys: ['鸡胸', '鸡肉', '牛肉', '猪肉', '鱼', '虾', '肉'], emoji: '🍗' },
  { keys: ['西蓝花', '菠菜', '生菜', '蔬菜', '菜'], emoji: '🥦' },
  { keys: ['苹果', '香蕉', '蓝莓', '草莓', '水果'], emoji: '🍎' },
  { keys: ['酸奶', '牛奶', '奶'], emoji: '🥛' },
  { keys: ['面', '面包', '馒头'], emoji: '🍞' },
  { keys: ['坚果', '花生', '杏仁'], emoji: '🥜' },
  { keys: ['汤'], emoji: '🍲' }
]

function foodToEmoji(name: string): string {
  const hit = foodEmojiRules.find(rule => rule.keys.some(key => name.includes(key)))
  return hit?.emoji || '🍽️'
}

const mealDistribution = computed(() => {
  const types: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
  const hints: Record<MealType, string> = {
    breakfast: '400-500 千卡',
    lunch: '600-700 千卡',
    dinner: '500-600 千卡',
    snack: '100-200 千卡'
  }
  const emojis: Record<MealType, string> = {
    breakfast: '☀️',
    lunch: '🌿',
    dinner: '🌙',
    snack: '🧁'
  }

  return types.map(type => {
    const mealItems = mealStore.getMealsByType(type)
    const previewSource = mealItems.slice(0, 3).map(item => item.foodName)

    return {
      type,
      label: MEAL_TYPE_LABELS[type],
      calories: Math.round(mealStore.caloriesByType(type)),
      hint: hints[type],
      emoji: emojis[type],
      previewFoods: previewSource.map(name => ({
        name,
        emoji: foodToEmoji(name)
      }))
    }
  })
})

function boundedPercent(v: number): number {
  if (!Number.isFinite(v)) {
    return 0
  }
  return Math.max(0, Math.min(100, v))
}

function formatTwo(n: number | null | undefined): string {
  const v = Number(n ?? 0)
  if (!Number.isFinite(v)) return '0.0'
  return v.toFixed(1)
}

function goToMealLog(type: MealType) {
  router.push(`/log?meal=${type}`)
}

function goToSettingsEdit(section: 'calorie' | 'weight' | 'macro') {
  router.push({ path: '/settings', query: { edit: section } })
}

onMounted(async () => {
  await Promise.all([
    settingsStore.loadSettings(),
    mealStore.loadMeals()
  ])
})
</script>

<style scoped>
.dashboard-page {
  padding: 38px 14px calc(84px + var(--safe-bottom));
}

.dashboard-header {
  margin-bottom: 8px;
  padding: 0 4px;
}

.page-title {
  font-size: 32px;
  margin: 0 0 2px;
  letter-spacing: -1px;
  color: #101726;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
}

.avatar-circle {
  border: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 22px;
  background: linear-gradient(135deg, #d8e6ef, #8fb6cc);
  box-shadow: 0 4px 14px rgba(102, 112, 120, 0.24);
  cursor: pointer;
}

.summary-card {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
  margin: 0;
  padding: 12px 12px;
  border-radius: 26px;
  border-color: #e6ebf2;
  box-shadow: 0 6px 22px rgba(38, 53, 76, 0.08);
  background:
    radial-gradient(circle at 14% 100%, rgba(170, 209, 224, 0.2), transparent 52%),
    radial-gradient(circle at 100% 0%, rgba(191, 209, 238, 0.12), transparent 40%),
    #ffffff;
}

.ring-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-foot {
  margin-top: -4px;
  color: #14a36f;
  font-weight: 700;
  font-size: 19px;
}

.summary-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}

.target-label {
  font-size: 15px;
  color: var(--text-secondary);
}

.target-value {
  padding: 0;
  border: none;
  background: transparent;
  margin-top: 0;
  font-size: 32px;
  font-weight: 760;
  color: #182132;
  letter-spacing: -0.6px;
  display: flex;
  align-items: baseline;
  gap: 4px;
  cursor: pointer;
}

.target-value span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.target-edit {
  font-size: 16px;
  color: #adb7c5;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: linear-gradient(180deg, #f8fafd, #f5f8fb);
  border: 1px solid #e9edf2;
  border-radius: 14px;
  padding: 8px 10px;
}

.summary-item {
  display: grid;
  grid-template-columns: 8px 1fr auto;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.remain-dot {
  background: #2bb673;
}

.sport-dot {
  background: #4787ff;
}

.item-label {
  font-size: 13px;
  color: #475164;
}

.item-value {
  font-size: 14px;
  font-weight: 700;
  color: #202a3d;
}

.item-value span {
  font-size: 12px;
  font-weight: 500;
  color: #7d8798;
}

.meal-panel {
  margin-top: 6px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0 2px 8px;
}

.meal-head {
  margin-top: 4px;
}

.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 740;
  color: #131d2f;
  letter-spacing: -0.6px;
}

.section-note {
  color: #8390a3;
  font-size: 14px;
  white-space: nowrap;
}

.meal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meal-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 18px;
  padding: 8px 10px;
  border: 1px solid #e6ebf3;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(41, 58, 84, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.meal-item:hover {
  box-shadow: 0 10px 24px rgba(41, 58, 84, 0.12);
}

.meal-item:active {
  transform: scale(0.985);
}

.meal-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.meal-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 16px;
  flex: 0 0 auto;
}

.meal-icon-breakfast {
  background: #fff4d6;
}

.meal-icon-lunch {
  background: #e2f8ea;
}

.meal-icon-dinner {
  background: #ede6ff;
}

.meal-icon-snack {
  background: #ffe9de;
}

.meal-main {
  min-width: 0;
}

.meal-name {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
}

.meal-calories {
  margin: 0;
  font-size: 28px;
  font-weight: 760;
  line-height: 1;
  color: #182235;
  letter-spacing: -0.4px;
}

.meal-calories span {
  font-size: 12px;
  font-weight: 500;
  color: #7f8898;
}

.meal-range {
  margin: 2px 0 0;
  font-size: 11px;
  color: #8b94a2;
}

.meal-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.food-empty {
  color: var(--text-secondary);
  font-size: 12px;
}

.food-stack {
  display: flex;
  align-items: center;
  gap: 0;
}

.food-thumb {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  border: 1px solid #edf0f5;
  background: linear-gradient(150deg, #fbfbfd, #f2f4f8);
  font-size: 18px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(38, 46, 61, 0.08);
}

.food-thumb + .food-thumb {
  margin-left: -6px;
}

.meal-chevron {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f0f3f8;
  color: #8792a5;
  display: grid;
  place-items: center;
  font-size: 13px;
}

.macro-card {
  margin-top: 8px;
  padding: 10px 10px 8px;
  border-color: #e6ebf2;
  box-shadow: 0 6px 18px rgba(41, 58, 84, 0.08);
}

.detail-link {
  padding: 0;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  color: #7f8898;
  cursor: pointer;
}

.macro-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.macro-col {
  border-radius: 12px;
  padding: 7px;
  background: linear-gradient(180deg, #fcfdff, #f9fbff);
  border: 1px solid #edf1f6;
}

.macro-label {
  margin: 0;
  font-size: 12px;
  color: #525d72;
  display: flex;
  align-items: center;
  gap: 4px;
}

.macro-value {
  margin: 2px 0 5px;
  font-size: 16px;
  font-weight: 760;
  color: #1f2635;
  line-height: 1.1;
}

.macro-value span {
  font-size: 12px;
  font-weight: 500;
  color: #8791a2;
}

.mini-progress {
  width: 100%;
  height: 5px;
  border-radius: 5px;
  background: #e9eef4;
  overflow: hidden;
}

.mini-progress span {
  display: block;
  height: 100%;
  border-radius: 6px;
}

.protein-col .mini-progress span {
  background: linear-gradient(90deg, #28b270, #7bd5ac);
}

.carbs-col .mini-progress span {
  background: linear-gradient(90deg, #4881f1, #78a7ff);
}

.fat-col .mini-progress span {
  background: linear-gradient(90deg, #ff932f, #ffb56b);
}

.macro-rate {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.protein-col .macro-rate {
  color: #20a66a;
}

.carbs-col .macro-rate {
  color: #3975e5;
}

.fat-col .macro-rate {
  color: #f1871f;
}

.tip-strip {
  margin-top: 8px;
  border: 1px solid #cae9d5;
  background: linear-gradient(180deg, #ecfaf1, #e3f6eb);
  border-radius: 12px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  color: #3f7157;
  font-size: 11px;
}

.tip-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #d4f2e1;
  display: grid;
  place-items: center;
}

.tip-strip p {
  margin: 0;
}

.tip-close {
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  color: #7fac95;
  display: grid;
  place-items: center;
  cursor: pointer;
}

@media (max-width: 430px) {
  .dashboard-page {
    padding-inline: 12px;
  }

  .section-title {
    font-size: 28px;
  }

  .meal-calories {
    font-size: 30px;
  }
}

@media (max-width: 360px) {
  .summary-card {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .summary-info {
    width: 100%;
  }
}
</style>
