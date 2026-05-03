# Android 构建

轻卡记使用 Capacitor 将 Vue 前端打包为 Android 应用。

## 前置要求

- Node.js
- Android Studio
- JDK
- Android SDK
- 已安装项目依赖

## Capacitor 配置

关键配置：

```txt
appId: com.calorie.tracker
webDir: dist
```

`webDir` 指向前端构建产物目录。

## 构建前端

在项目根目录执行：

```bash
npm run build
```

构建完成后会生成：

```txt
dist/
```

## 同步 Android 项目

```bash
npx cap sync android
```

## 打开 Android Studio

```bash
npx cap open android
```

之后可以在 Android Studio 中运行、调试或打包 APK。

## 常用开发流程

```bash
npm run build
npx cap sync android
npx cap open android
```

## 接口地址注意事项

移动端运行时不能直接使用浏览器中的 `localhost` 访问电脑后端。

如果 Android 真机需要访问本机后端，通常需要把 `VITE_API_URL` 设置为电脑局域网 IP，例如：

```env
VITE_API_URL=http://192.168.1.100:3000/api
```

如果使用 Android 模拟器访问宿主机，可以根据模拟器环境使用对应地址，例如 Android Emulator 常用：

```env
VITE_API_URL=http://10.0.2.2:3000/api
```

## 权限提示

Capacitor plugin 权限提示语应使用中文。

涉及相机、相册等能力时，应确保 Android 权限配置和用户提示符合中文应用体验。

## 发布前检查

- 后端 API 地址是否正确
- 是否使用生产环境配置
- 是否删除调试日志
- 深色模式是否正常
- 登录状态刷新是否正常
- AI 拍照识别是否正常
- Android 权限提示是否为中文

