# API文档

## 基础信息

- **Base URL**: `https://your-domain.vercel.app/api`
- **认证方式**: JWT Token
- **内容类型**: `application/json`

## 认证

### 注册用户
```http
POST /api/auth/register
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "credits": 100,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

### 用户登录
```http
POST /api/auth/login
```

**请求体:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "credits": 100
    },
    "token": "jwt_token_here"
  }
}
```

## 翻译服务

### 翻译日语Prompt
```http
POST /api/translate
```

**请求头:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体:**
```json
{
  "originalPrompt": "美しい女性が「こんにちは、今日はいい天気ですね」と笑顔で言っている",
  "includeDialogue": true,
  "addRomaji": true
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "originalPrompt": "美しい女性が「こんにちは、今日はいい天気ですね」と笑顔で言っている",
    "translatedPrompt": "A beautiful woman is smiling and saying 'Konnichiwa, kyou wa ii tenki desu ne (Hello, it's nice weather today)' - Speak in Japanese",
    "dialogues": [
      {
        "original": "こんにちは、今日はいい天気ですね",
        "translated": "Hello, it's nice weather today",
        "romaji": "Konnichiwa, kyou wa ii tenki desu ne"
      }
    ],
    "translationTime": 1.2
  }
}
```

## 视频生成

### 生成视频
```http
POST /api/generate
```

**请求头:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体:**
```json
{
  "originalPrompt": "美しい女性が「こんにちは」と言っている",
  "translatedPrompt": "A beautiful woman saying 'Konnichiwa (Hello)' - Speak in Japanese",
  "duration": 6,
  "resolution": "1080P",
  "firstFrameImage": "base64_image_data_or_url"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "videoId": "uuid",
    "taskId": "kie_ai_task_id",
    "status": "processing",
    "creditsUsed": 100,
    "estimatedTime": 180,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 查询视频状态
```http
GET /api/status/[taskId]
```

**请求头:**
```
Authorization: Bearer <jwt_token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "videoId": "uuid",
    "taskId": "kie_ai_task_id",
    "status": "completed",
    "videoUrl": "https://example.com/video.mp4",
    "thumbnailUrl": "https://example.com/thumbnail.jpg",
    "duration": 6,
    "resolution": "1080P",
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:03:00Z"
  }
}
```

**状态说明:**
- `processing`: 生成中
- `completed`: 完成
- `failed`: 失败
- `cancelled`: 取消

## 用户管理

### 获取用户信息
```http
GET /api/user/profile
```

**请求头:**
```
Authorization: Bearer <jwt_token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "credits": 450,
    "totalUsed": 550,
    "videosGenerated": 5,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 获取用户历史记录
```http
GET /api/user/history?page=1&limit=10
```

**请求头:**
```
Authorization: Bearer <jwt_token>
```

**查询参数:**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）
- `status`: 状态筛选（可选）

**响应:**
```json
{
  "success": true,
  "data": {
    "videos": [
      {
        "id": "uuid",
        "originalPrompt": "美しい女性が挨拶している",
        "translatedPrompt": "A beautiful woman greeting",
        "status": "completed",
        "videoUrl": "https://example.com/video.mp4",
        "thumbnailUrl": "https://example.com/thumbnail.jpg",
        "creditsUsed": 100,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## 支付系统

### 获取充值套餐
```http
GET /api/payment/packages
```

**响应:**
```json
{
  "success": true,
  "data": {
    "packages": [
      {
        "id": "starter",
        "name": "入门包",
        "credits": 1000,
        "price": 980,
        "currency": "JPY",
        "discount": 0
      },
      {
        "id": "standard",
        "name": "标准包",
        "credits": 3000,
        "price": 2580,
        "currency": "JPY",
        "discount": 12
      },
      {
        "id": "pro",
        "name": "专业包",
        "credits": 10000,
        "price": 7800,
        "currency": "JPY",
        "discount": 20
      }
    ]
  }
}
```

### 创建支付订单
```http
POST /api/payment/create
```

**请求头:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体:**
```json
{
  "packageId": "standard",
  "paymentMethod": "stripe" // 或 "paypay"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "paymentUrl": "https://stripe.com/pay/...",
    "amount": 2580,
    "currency": "JPY",
    "credits": 3000,
    "expiresAt": "2024-01-01T01:00:00Z"
  }
}
```

### 支付回调处理
```http
POST /api/payment/webhook
```

**请求体:**
```json
{
  "orderId": "uuid",
  "status": "completed",
  "transactionId": "stripe_transaction_id",
  "amount": 2580,
  "currency": "JPY"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "status": "completed",
    "creditsAdded": 3000,
    "newBalance": 3450
  }
}
```

## 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "点数不足，请充值后再试",
    "details": {
      "required": 100,
      "current": 50
    }
  }
}
```

### 常见错误代码

| 错误代码 | HTTP状态码 | 说明 |
|---------|-----------|------|
| `UNAUTHORIZED` | 401 | 未授权，需要登录 |
| `FORBIDDEN` | 403 | 禁止访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数错误 |
| `INSUFFICIENT_CREDITS` | 400 | 点数不足 |
| `TRANSLATION_FAILED` | 500 | 翻译失败 |
| `GENERATION_FAILED` | 500 | 视频生成失败 |
| `PAYMENT_FAILED` | 400 | 支付失败 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `SERVER_ERROR` | 500 | 服务器内部错误 |

## 限制说明

### 请求限制
- **翻译API**: 每分钟最多60次请求
- **生成API**: 每分钟最多10次请求
- **查询API**: 每分钟最多120次请求

### 文件限制
- **图片大小**: 最大10MB
- **支持格式**: JPG, PNG, GIF, WEBP
- **图片尺寸**: 最大4096x4096像素

### 内容限制
- **Prompt长度**: 最大1000字符
- **视频时长**: 6-10秒
- **分辨率**: 768P, 1080P

## 示例代码

### JavaScript/TypeScript
```javascript
// 用户登录
const loginUser = async (email, password) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // 保存token
      localStorage.setItem('token', data.data.token);
      return data.data.user;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// 生成视频
const generateVideo = async (prompt, options = {}) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        originalPrompt: prompt,
        ...options
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Video generation failed:', error);
    throw error;
  }
};
```

## 更新历史

### v1.0.0 (2024-01-01)
- 初始API版本发布
- 支持用户认证
- 支持日语翻译
- 支持视频生成
- 支持支付系统 