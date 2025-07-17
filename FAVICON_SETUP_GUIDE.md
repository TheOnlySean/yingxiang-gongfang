# 映像工房 - Favicon 设置指南

## 🎯 Favicon 设置方案

### 1. 推荐的Favicon文件格式和尺寸

```
favicon.ico          - 16x16, 32x32, 48x48 (多尺寸ICO文件)
favicon-16x16.png    - 16x16 (浏览器标签)
favicon-32x32.png    - 32x32 (浏览器标签)
apple-touch-icon.png - 180x180 (iOS设备)
android-chrome-192x192.png - 192x192 (Android设备)
android-chrome-512x512.png - 512x512 (Android设备)
```

### 2. 文件放置位置

所有favicon文件应该放在 `public/` 目录下：

```
public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
└── site.webmanifest
```

### 3. 设计建议

基于映像工房的品牌设计：

#### 设计元素：
- **主色调**：#e60033 (映像工房红色)
- **辅助色**：#ff6b7a (渐变粉色)
- **背景**：深色 (#1a1a1a) 或透明
- **字体**：简洁的"映"字或"EK"字母组合

#### 设计方案：
1. **方案A**：使用"映"字的简化版本
2. **方案B**：使用"EK"字母组合 (Eizo Kobo)
3. **方案C**：使用摄像机图标 + 渐变背景

### 4. 在线Favicon生成工具

推荐使用以下工具：
- [Favicon.io](https://favicon.io/) - 免费，支持文字和图标
- [RealFaviconGenerator](https://realfavicongenerator.net/) - 专业，支持所有平台
- [Favicon Generator](https://www.favicon-generator.org/) - 简单易用

### 5. Next.js中的Favicon配置

在 `app/layout.tsx` 中添加favicon链接：

```typescript
export const metadata: Metadata = {
  title: '映像工房',
  description: '想像を動画に変える魔法 - AI動画生成ツール',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}
```

### 6. Web App Manifest配置

创建 `public/site.webmanifest` 文件：

```json
{
  "name": "映像工房",
  "short_name": "映像工房",
  "description": "想像を動画に変える魔法 - AI動画生成ツール",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#e60033",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 7. 实施步骤

1. **设计favicon图标**（推荐使用设计工具或在线生成器）
2. **生成多种尺寸的文件**
3. **将文件放置到public目录**
4. **更新layout.tsx配置**
5. **创建web manifest文件**
6. **测试各种设备和浏览器**

### 8. 测试验证

部署后检查：
- 浏览器标签页图标
- 书签图标
- iOS设备主屏幕图标
- Android设备主屏幕图标
- PWA应用图标

---

**下一步**：您希望我帮您创建favicon文件，还是您有特定的设计需求？ 