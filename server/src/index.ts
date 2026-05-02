import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import foodRoutes from './routes/foods.js'
import mealRoutes from './routes/meals.js'
import weightRoutes from './routes/weight.js'
import settingsRoutes from './routes/settings.js'
import aiRoutes from './routes/ai.js'
import templateRoutes from './routes/templates.js'

const app = express()

app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json({ limit: '10mb' }))

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/foods', foodRoutes)
app.use('/api/meals', mealRoutes)
app.use('/api/weight', weightRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/meals/templates', templateRoutes)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
  console.log(`Environment: ${config.nodeEnv}`)
})

export default app
