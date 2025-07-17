# Templates 数据库系统总结

## 数据库表结构

### `templates` 表
- **id** (integer, NOT NULL, PRIMARY KEY) - 自增主键
- **template_name** (varchar(50), NOT NULL, UNIQUE) - 模板唯一标识符
- **hint** (text, NOT NULL) - 翻译阶段的系统提示
- **add_on** (text, NOT NULL) - 视频生成阶段的prompt前缀
- **display_name_en** (varchar(100), NOT NULL) - 英文显示名称
- **display_name_ja** (varchar(100), NOT NULL) - 日文显示名称
- **description** (text, nullable) - 模板描述
- **thumbnail_url** (varchar(255), nullable) - 缩略图URL
- **is_active** (boolean, nullable, default: true) - 是否激活
- **sort_order** (integer, nullable, default: 0) - 排序顺序

## 现有模板数据

| ID | template_name | display_name_ja | 功能描述 |
|----|---------------|----------------|----------|
| 1  | selling       | 販売           | 销售/宣传类视频 |
| 2  | selfie        | セルフィー      | 自拍风格视频 |
| 3  | interview     | インタビュー    | 访谈对话类视频 |
| 4  | steadicam     | ステディカム    | 专业摄影运镜 |
| 5  | singing       | 歌唱           | 歌唱音乐表演 |
| 6  | general       | 一般           | 通用模板(无增强) |

## 系统集成

### 翻译阶段 (`lib/translation.ts`)
- 使用 `hint` 字段作为翻译系统的上下文提示
- 通过 `dbAdmin.getTemplateByName(templateId)` 获取模板
- 将hint添加到OpenAI翻译的系统提示中

### 视频生成阶段 (`lib/video-generation.ts`)
- 使用 `add_on` 字段作为prompt前缀
- 通过 `dbAdmin.getTemplateByName(templateId)` 获取模板
- 将add_on添加到翻译后的prompt前面

### 数据库操作 (`lib/database.ts`)
- `getTemplateByName(templateName)` - 根据名称获取模板
- `getAllTemplates(activeOnly)` - 获取所有模板
- `createTemplate(data)` - 创建新模板
- `updateTemplate(id, data)` - 更新模板
- `deleteTemplate(id)` - 删除模板

## 使用示例

### 获取selling模板
```javascript
const template = await dbAdmin.getTemplateByName('selling');
console.log(template.hint); // "The content is about selling or promoting products."
console.log(template.add_on); // "This is a video of someone selling or promoting a product..."
```

### 翻译阶段使用
```javascript
// 在翻译系统中自动添加hint到系统提示
if (templateId && templateId !== 'general') {
  const template = await dbAdmin.getTemplateByName(templateId);
  if (template && template.hint) {
    systemPrompt += `\n\nScene Context: ${template.hint}`;
  }
}
```

### 视频生成阶段使用
```javascript
// 在视频生成中自动添加add_on到prompt前缀
if (templateId && templateId !== 'general') {
  const template = await dbAdmin.getTemplateByName(templateId);
  if (template && template.add_on) {
    finalPrompt = `${template.add_on}\n\n${translatedPrompt}`;
  }
}
```

## 特殊处理

### General模板
- `hint` 和 `add_on` 都为空字符串
- 不会对翻译和视频生成添加任何增强
- 作为默认/通用选项

### 错误处理
- 如果模板不存在，系统会fallback到原始prompt
- 数据库查询错误不会影响视频生成流程
- 所有模板操作都有完整的错误日志

## 维护说明

1. **添加新模板**: 使用 `createTemplate()` 方法
2. **修改模板**: 使用 `updateTemplate()` 方法
3. **禁用模板**: 设置 `is_active = false`
4. **排序**: 通过 `sort_order` 字段控制显示顺序

## 系统状态

✅ **数据库表已创建并简化**
✅ **6个默认模板已插入**
✅ **翻译系统已集成**
✅ **视频生成系统已集成**
✅ **所有CRUD操作已实现**
✅ **错误处理已完善**

模板系统现已完全从硬编码转换为数据库驱动，支持动态管理和扩展。 