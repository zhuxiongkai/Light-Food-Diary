import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.calorie.tracker',
  appName: '轻卡记',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissionMessage: '需要使用相机拍摄食物照片'
    },
    Filesystem: {
      permissionMessage: '需要访问文件以保存数据'
    }
  }
}

export default config
