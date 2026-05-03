import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const spec = {
  openapi: '3.0.3',
  info: {
    title: '轻卡记 API',
    description: '热量摄入追踪应用后端接口文档\n\n## 调用流程\n1. 先调 `/auth/register` 注册，或 `/auth/login` 登录\n2. Apifox 会自动从登录/注册响应中提取 `accessToken` 到环境变量\n3. 其他接口会自带 Bearer Token 认证',
    version: '0.1.0',
  },
  servers: [{ url: 'http://localhost:3000/api', description: '本地开发环境' }],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '从登录/注册接口返回的 accessToken',
      },
    },

    schemas: {
      // ========== 通用响应 ==========
      Success: {
        type: 'object',
        properties: {
          code: { type: 'integer', example: 0 },
          message: { type: 'string', example: 'ok' },
          data: {},
        },
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'integer', example: -1 },
          message: { type: 'string', example: '用户名和密码不能为空' },
        },
      },

      // ========== 认证 ==========
      RegisterBody: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'testuser', description: '用户名' },
          password: { type: 'string', minLength: 6, example: '123456', description: '密码，至少6位' },
          email: { type: 'string', format: 'email', example: 'test@example.com', description: '邮箱(可选)' },
        },
        example: { username: 'testuser', password: '123456', email: 'test@example.com' },
      },
      LoginBody: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'testuser' },
          password: { type: 'string', example: '123456' },
        },
        example: { username: 'testuser', password: '123456' },
      },
      AuthData: {
        type: 'object',
        properties: {
          userId: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'testuser' },
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...', description: '15分钟有效期' },
          refreshToken: { type: 'string', example: 'dGhpcyBpcyBhIHJlZnJl...', description: '7天有效期' },
        },
      },
      RefreshBody: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', example: 'dGhpcyBpcyBhIHJlZnJl...' },
        },
        example: { refreshToken: 'dGhpcyBpcyBhIHJlZnJl...' },
      },
      RefreshData: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
          refreshToken: { type: 'string', example: 'bmV3IHJlZnJlc2ggdG9r...' },
        },
      },
      UserInfo: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'testuser' },
          email: { type: 'string', example: 'test@example.com' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-05-01T12:00:00.000Z' },
        },
      },

      // ========== 食物 ==========
      FoodItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: '米饭' },
          category: { type: 'string', enum: ['staple', 'meat', 'vegetable', 'fruit', 'snack', 'drink', 'custom'], example: 'staple' },
          caloriesPer100g: { type: 'number', example: 116 },
          protein: { type: 'number', example: 2.6 },
          fat: { type: 'number', example: 0.3 },
          carbs: { type: 'number', example: 25.9 },
        },
      },
      CustomFoodBody: {
        type: 'object',
        required: ['name', 'category'],
        properties: {
          name: { type: 'string', example: '蛋白粉奶昔', description: '食物名称' },
          category: { type: 'string', enum: ['staple', 'meat', 'vegetable', 'fruit', 'snack', 'drink', 'custom'], example: 'drink', description: '分类' },
          caloriesPer100g: { type: 'number', example: 380, description: '每100g热量(kcal)' },
          protein: { type: 'number', example: 80 },
          fat: { type: 'number', example: 3.5 },
          carbs: { type: 'number', example: 8 },
        },
        example: { name: '蛋白粉奶昔', category: 'drink', caloriesPer100g: 380, protein: 80, fat: 3.5, carbs: 8 },
      },

      // ========== 餐食 ==========
      MealItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          date: { type: 'string', format: 'date', example: '2026-05-02' },
          mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'], example: 'breakfast' },
          foodId: { type: 'integer', example: 1 },
          foodName: { type: 'string', example: '米饭' },
          weight: { type: 'number', example: 200, description: '摄入克数' },
          calories: { type: 'number', example: 232 },
          protein: { type: 'number', example: 5.2 },
          fat: { type: 'number', example: 0.6 },
          carbs: { type: 'number', example: 51.8 },
        },
      },
      AddMealBody: {
        type: 'object',
        required: ['date', 'mealType', 'foodName'],
        properties: {
          date: { type: 'string', format: 'date', example: '2026-05-02' },
          mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'], example: 'lunch' },
          foodId: { type: 'integer', example: 1, description: '食物ID(内置食物传正数，自定义食物传0)' },
          foodName: { type: 'string', example: '米饭' },
          weight: { type: 'number', example: 200, description: '克数(>0)' },
          calories: { type: 'number', example: 232, description: 'kcal(>=0)' },
          protein: { type: 'number', example: 5.2 },
          fat: { type: 'number', example: 0.6 },
          carbs: { type: 'number', example: 51.8 },
        },
        example: { date: '2026-05-02', mealType: 'lunch', foodId: 1, foodName: '米饭', weight: 200, calories: 232, protein: 5.2, fat: 0.6, carbs: 51.8 },
      },
      MealStats: {
        type: 'object',
        properties: {
          totalCalories: { type: 'number', example: 1850 },
          totalProtein: { type: 'number', example: 72.5 },
          totalFat: { type: 'number', example: 48.3 },
          totalCarbs: { type: 'number', example: 265.8 },
        },
      },

      // ========== 体重 ==========
      WeightItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          userId: { type: 'integer', example: 1 },
          date: { type: 'string', format: 'date', example: '2026-05-02' },
          weight: { type: 'number', example: 72.5, description: '体重(kg)' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-05-02T08:30:00.000Z' },
        },
      },
      AddWeightBody: {
        type: 'object',
        required: ['weight'],
        properties: {
          weight: { type: 'number', example: 72.5, description: '体重(kg)' },
          date: { type: 'string', format: 'date', example: '2026-05-02', description: '日期(默认今天)' },
        },
        example: { weight: 72.5, date: '2026-05-02' },
      },

      // ========== 设置 ==========
      SettingsData: {
        type: 'object',
        properties: {
          dailyCalorieGoal: { type: 'integer', example: 2000 },
          proteinRatio: { type: 'number', example: 20 },
          fatRatio: { type: 'number', example: 25 },
          carbsRatio: { type: 'number', example: 55 },
          height: { type: 'number', example: 175 },
          weight: { type: 'number', example: 72 },
          age: { type: 'integer', example: 28 },
          gender: { type: 'string', enum: ['male', 'female'], example: 'male' },
          weightGoal: { type: 'number', example: 65 },
        },
      },
      UpdateSettingsBody: {
        type: 'object',
        properties: {
          dailyCalorieGoal: { type: 'integer', example: 1800 },
          proteinRatio: { type: 'number', example: 25 },
          fatRatio: { type: 'number', example: 20 },
          carbsRatio: { type: 'number', example: 55 },
          height: { type: 'number', example: 175 },
          weight: { type: 'number', example: 72 },
          age: { type: 'integer', example: 28 },
          gender: { type: 'string', enum: ['male', 'female'], example: 'male' },
          weightGoal: { type: 'number', example: 65 },
        },
        example: { dailyCalorieGoal: 1800, proteinRatio: 25, fatRatio: 20, carbsRatio: 55 },
      },

      // ========== AI ==========
      AiBody: {
        type: 'object',
        required: ['imageBase64', 'mediaType'],
        properties: {
          imageBase64: { type: 'string', example: '/9j/4AAQSkZJRg...', description: '图片Base64(可带data:前缀)' },
          mediaType: { type: 'string', enum: ['image/jpeg', 'image/png'], example: 'image/jpeg', description: '图片MIME' },
        },
        example: { imageBase64: '/9j/4AAQSkZJRg...(请替换为真实Base64)', mediaType: 'image/jpeg' },
      },
      AiResult: {
        type: 'object',
        properties: {
          foodName: { type: 'string', example: '番茄炒蛋' },
          estimatedWeight: { type: 'number', example: 100 },
          estimatedCalories: { type: 'number', example: 83 },
          confidence: { type: 'number', example: 0.92 },
          matchedFoodId: { type: 'number', example: 213 },
          matchedFoodName: { type: 'string', example: '西红柿炒鸡蛋' },
          protein: { type: 'number', description: '每 100g 蛋白质', example: 4.2 },
          fat: { type: 'number', description: '每 100g 脂肪', example: 5.8 },
          carbs: { type: 'number', description: '每 100g 碳水化合物', example: 3.8 },
          nutritionSource: { type: 'string', enum: ['food-db', 'alias', 'unknown'], example: 'alias' },
        },
      },
    },
  },

  paths: {
    '/health': {
      get: {
        tags: ['系统'],
        summary: '健康检查',
        security: [],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { status: { type: 'string' }, time: { type: 'string' } } },
                example: { status: 'ok', time: '2026-05-02T12:00:00.000Z' },
              },
            },
          },
        },
      },
    },

    // ==================== 认证 ====================
    '/auth/register': {
      post: {
        tags: ['认证'],
        summary: '用户注册',
        description: '新用户注册，成功后返回 Token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterBody' } } },
        },
        responses: {
          '201': {
            description: '注册成功',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/Success' }],
                  properties: { data: { $ref: '#/components/schemas/AuthData' } },
                },
                example: {
                  code: 0,
                  data: { userId: 1, username: 'testuser', accessToken: 'eyJhbGciOiJI...', refreshToken: 'dGhpcyBp...' },
                  message: '注册成功',
                },
              },
            },
          },
          '400': {
            description: '参数错误',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '用户名和密码不能为空' } } },
          },
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['认证'],
        summary: '用户登录',
        description: '登录成功后 Apifox 自动提取 accessToken 到环境变量',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginBody' } } },
        },
        responses: {
          '200': {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/Success' }],
                  properties: { data: { $ref: '#/components/schemas/AuthData' } },
                },
                example: {
                  code: 0,
                  data: { userId: 1, username: 'testuser', accessToken: 'eyJhbGciOiJI...', refreshToken: 'dGhpcyBp...' },
                  message: '登录成功',
                },
              },
            },
          },
          '400': {
            description: '参数错误',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '用户名和密码不能为空' } } },
          },
        },
      },
    },

    '/auth/refresh': {
      post: {
        tags: ['认证'],
        summary: '刷新 Token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshBody' } } },
        },
        responses: {
          '200': {
            description: '刷新成功',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/Success' }],
                  properties: { data: { $ref: '#/components/schemas/RefreshData' } },
                },
                example: { code: 0, data: { accessToken: 'eyJhbGc...', refreshToken: 'bmV3IH...' }, message: 'ok' },
              },
            },
          },
          '400': {
            description: '缺少 refreshToken',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '缺少refreshToken' } } },
          },
        },
      },
    },

    '/auth/me': {
      get: {
        tags: ['认证'],
        summary: '获取当前用户信息',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/Success' }],
                  properties: { data: { $ref: '#/components/schemas/UserInfo' } },
                },
                example: { code: 0, data: { id: 1, username: 'testuser', email: 'test@example.com', createdAt: '2026-05-01T12:00:00.000Z' }, message: 'ok' },
              },
            },
          },
          '401': {
            description: '未登录',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '未登录或Token已过期' } } },
          },
        },
      },
    },

    // ==================== 食物库 ====================
    '/foods': {
      get: {
        tags: ['食物库'],
        summary: '搜索食物',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'keyword', in: 'query', schema: { type: 'string' }, example: '鸡', description: '搜索关键词' },
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['staple', 'meat', 'vegetable', 'fruit', 'snack', 'drink', 'custom'] }, example: 'meat', description: '分类' },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/Success' }],
                  properties: { data: { type: 'array', items: { $ref: '#/components/schemas/FoodItem' } } },
                },
                example: { code: 0, data: [{ id: 31, name: '鸡胸肉', category: 'meat', caloriesPer100g: 133, protein: 31, fat: 1.2, carbs: 0 }], message: 'ok' },
              },
            },
          },
        },
      },
    },

    '/foods/custom': {
      post: {
        tags: ['食物库'],
        summary: '添加自定义食物',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomFoodBody' } } },
        },
        responses: {
          '201': {
            description: '添加成功',
            content: {
              'application/json': {
                schema: { allOf: [{ $ref: '#/components/schemas/Success' }], properties: { data: { $ref: '#/components/schemas/FoodItem' } } },
                example: { code: 0, data: { id: 999, name: '蛋白粉奶昔', category: 'drink', caloriesPer100g: 380, protein: 80, fat: 3.5, carbs: 8 }, message: '添加成功' },
              },
            },
          },
          '400': {
            description: '参数错误',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '名称和分类不能为空' } } },
          },
        },
      },
    },

    '/foods/custom/{id}': {
      put: {
        tags: ['食物库'],
        summary: '修改自定义食物',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1, description: '食物ID' }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomFoodBody' } } },
        },
        responses: {
          '200': {
            description: '更新成功',
            content: {
              'application/json': {
                example: { code: 0, data: { id: 1, name: '蛋白粉奶昔(更新)', category: 'drink', caloriesPer100g: 400, protein: 85, fat: 3, carbs: 7 }, message: '更新成功' },
              },
            },
          },
          '400': {
            description: 'ID无效',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '食物ID无效' } } },
          },
        },
      },
      delete: {
        tags: ['食物库'],
        summary: '删除自定义食物',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1, description: '食物ID' }],
        responses: {
          '200': {
            description: '删除成功',
            content: { 'application/json': { example: { code: 0, data: null, message: '删除成功' } } },
          },
          '400': {
            description: 'ID无效',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '食物ID无效' } } },
          },
        },
      },
    },

    // ==================== 餐食记录 ====================
    '/meals': {
      get: {
        tags: ['餐食记录'],
        summary: '获取指定日期餐食',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-05-02', description: '日期(默认今天)' },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/Success' }],
                  properties: { data: { type: 'array', items: { $ref: '#/components/schemas/MealItem' } } },
                },
                example: {
                  code: 0,
                  data: [
                    { id: 1, userId: 1, date: '2026-05-02', mealType: 'breakfast', foodId: 1, foodName: '米饭', weight: 200, calories: 232, protein: 5.2, fat: 0.6, carbs: 51.8 },
                    { id: 2, userId: 1, date: '2026-05-02', mealType: 'lunch', foodId: 31, foodName: '鸡胸肉', weight: 150, calories: 199.5, protein: 46.5, fat: 1.8, carbs: 0 },
                  ],
                  message: 'ok',
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['餐食记录'],
        summary: '添加餐食记录',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddMealBody' } } },
        },
        responses: {
          '201': {
            description: '添加成功',
            content: {
              'application/json': {
                schema: { allOf: [{ $ref: '#/components/schemas/Success' }], properties: { data: { $ref: '#/components/schemas/MealItem' } } },
                example: { code: 0, data: { id: 3, userId: 1, date: '2026-05-02', mealType: 'lunch', foodId: 1, foodName: '米饭', weight: 200, calories: 232, protein: 5.2, fat: 0.6, carbs: 51.8 }, message: '添加成功' },
              },
            },
          },
          '400': {
            description: '参数校验失败',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '日期、餐别和食物名不能为空' } } },
          },
        },
      },
    },

    '/meals/range': {
      get: {
        tags: ['餐食记录'],
        summary: '按日期范围获取餐食',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'start', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2026-05-01', description: '开始日期' },
          { name: 'end', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2026-05-02', description: '结束日期' },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                example: { code: 0, data: [], message: 'ok' },
              },
            },
          },
          '400': {
            description: '参数缺失',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: 'start和end参数必填' } } },
          },
        },
      },
    },

    '/meals/stats': {
      get: {
        tags: ['餐食记录'],
        summary: '获取每日营养统计',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, example: '2026-05-02', description: '日期(默认今天)' },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/Success' }],
                  properties: { data: { $ref: '#/components/schemas/MealStats' } },
                },
                example: { code: 0, data: { totalCalories: 1850, totalProtein: 72.5, totalFat: 48.3, totalCarbs: 265.8 }, message: 'ok' },
              },
            },
          },
        },
      },
    },

    '/meals/{id}': {
      put: {
        tags: ['餐食记录'],
        summary: '修改餐食记录',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1, description: '记录ID' }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddMealBody' } } },
        },
        responses: {
          '200': {
            description: '更新成功',
            content: { 'application/json': { example: { code: 0, data: { id: 1 }, message: '更新成功' } } },
          },
          '400': {
            description: 'ID无效',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '记录ID无效' } } },
          },
        },
      },
      delete: {
        tags: ['餐食记录'],
        summary: '删除餐食记录',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1, description: '记录ID' }],
        responses: {
          '200': {
            description: '删除成功',
            content: { 'application/json': { example: { code: 0, data: null, message: '删除成功' } } },
          },
          '400': {
            description: 'ID无效',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '记录ID无效' } } },
          },
        },
      },
    },

    // ==================== 体重记录 ====================
    '/weight': {
      get: {
        tags: ['体重记录'],
        summary: '获取体重记录列表',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: { allOf: [{ $ref: '#/components/schemas/Success' }], properties: { data: { type: 'array', items: { $ref: '#/components/schemas/WeightItem' } } } },
                example: { code: 0, data: [{ id: 1, userId: 1, date: '2026-05-02', weight: 72.5, createdAt: '2026-05-02T08:30:00.000Z' }], message: 'ok' },
              },
            },
          },
        },
      },
      post: {
        tags: ['体重记录'],
        summary: '添加体重记录',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddWeightBody' } } },
        },
        responses: {
          '201': {
            description: '添加成功',
            content: {
              'application/json': {
                example: { code: 0, data: { id: 2, userId: 1, date: '2026-05-02', weight: 72.5, createdAt: '2026-05-02T08:30:00.000Z' }, message: '添加成功' },
              },
            },
          },
          '400': {
            description: '参数无效',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '体重数据无效' } } },
          },
        },
      },
    },

    '/weight/range': {
      get: {
        tags: ['体重记录'],
        summary: '按日期范围获取体重',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'start', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2026-05-01', description: '开始日期' },
          { name: 'end', in: 'query', required: true, schema: { type: 'string', format: 'date' }, example: '2026-05-02', description: '结束日期' },
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                example: { code: 0, data: [{ id: 1, userId: 1, date: '2026-05-01', weight: 73.0 }, { id: 2, userId: 1, date: '2026-05-02', weight: 72.5 }], message: 'ok' },
              },
            },
          },
          '400': {
            description: '参数缺失',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: 'start和end参数必填' } } },
          },
        },
      },
    },

    '/weight/{id}': {
      delete: {
        tags: ['体重记录'],
        summary: '删除体重记录',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' }, example: 1, description: '记录ID' }],
        responses: {
          '200': {
            description: '删除成功',
            content: { 'application/json': { example: { code: 0, data: null, message: '删除成功' } } },
          },
          '400': {
            description: 'ID无效',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '记录ID无效' } } },
          },
        },
      },
    },

    // ==================== 用户设置 ====================
    '/settings': {
      get: {
        tags: ['用户设置'],
        summary: '获取用户设置',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: { allOf: [{ $ref: '#/components/schemas/Success' }], properties: { data: { $ref: '#/components/schemas/SettingsData' } } },
                example: { code: 0, data: { dailyCalorieGoal: 2000, proteinRatio: 20, fatRatio: 25, carbsRatio: 55, height: 175, weight: 72, age: 28, gender: 'male', weightGoal: 65 }, message: 'ok' },
              },
            },
          },
        },
      },
      put: {
        tags: ['用户设置'],
        summary: '更新用户设置',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateSettingsBody' } } },
        },
        responses: {
          '200': {
            description: '保存成功',
            content: {
              'application/json': {
                example: { code: 0, data: { dailyCalorieGoal: 1800, proteinRatio: 25, fatRatio: 20, carbsRatio: 55, height: 175, weight: 72, age: 28, gender: 'male', weightGoal: 65 }, message: '保存成功' },
              },
            },
          },
        },
      },
    },

    // ==================== AI 识别 ====================
    '/ai/advice': {
      post: {
        tags: ['AI识别'],
        summary: 'AI 营养建议',
        description:
          '基于用户近 7 天饮食记录与设置中的目标，调用 DeepSeek Chat API 生成中文营养解读。需在服务端配置 DEEPSEEK_API_KEY。',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                example: { code: 0, data: { advice: '...' }, message: 'ok' },
              },
            },
          },
        },
      },
    },
    '/ai/recognize': {
      post: {
        tags: ['AI识别'],
        summary: 'AI 食物识别',
        description: '上传食物图片 Base64，调用百度AI菜品识别。限制: ≤5MB, 仅 JPEG/PNG。\n\n**注意**: 需要替换真实的 Base64 图片数据才能正常调用。',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AiBody' } } },
        },
        responses: {
          '200': {
            description: '识别成功',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/Success' }],
                  properties: { data: { type: 'array', items: { $ref: '#/components/schemas/AiResult' } } },
                },
                example: {
                  code: 0,
                  data: [
                    {
                      foodName: '番茄炒蛋',
                      estimatedWeight: 100,
                      estimatedCalories: 83,
                      confidence: 0.92,
                      matchedFoodId: 213,
                      matchedFoodName: '西红柿炒鸡蛋',
                      protein: 4.2,
                      fat: 5.8,
                      carbs: 3.8,
                      nutritionSource: 'alias',
                    },
                    {
                      foodName: '米饭',
                      estimatedWeight: 100,
                      estimatedCalories: 116,
                      confidence: 0.88,
                      matchedFoodId: 1,
                      matchedFoodName: '米饭',
                      protein: 2.6,
                      fat: 0.3,
                      carbs: 25.9,
                      nutritionSource: 'food-db',
                    },
                  ],
                  message: 'ok',
                },
              },
            },
          },
          '400': {
            description: '图片数据无效',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '缺少图片数据' } } },
          },
          '413': {
            description: '图片过大',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { code: -1, message: '图片过大，请压缩到 5MB 以内' } } },
          },
        },
      },
    },
  },
} as const

const outPath = resolve(__dirname, '..', 'openapi.json')
writeFileSync(outPath, JSON.stringify(spec, null, 2), 'utf-8')
console.log(`OpenAPI 规格已生成: ${outPath}`)
