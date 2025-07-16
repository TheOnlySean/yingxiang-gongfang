import OpenAI from 'openai';
import crypto from 'crypto';
import { dbAdmin } from './database';
import { ITranslation, IDialogue, IApiResponse, API_ERROR_CODES } from '@/types';

// OpenAI配置
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// 日语对话模式检测正则表达式
const DIALOGUE_PATTERNS = [
  /「([^」]+)」/g, // 日式引号
  /『([^』]+)』/g, // 日式双引号
  /"([^"]+)"/g,   // 英式引号
  /'([^']+)'/g,   // 单引号
  /([^。！？]*(?:言う|話す|語る|叫ぶ|呼ぶ|答える|返事|質問)[^。！？]*)/g // 动词模式
];

// 罗马音转换映射表
const ROMAJI_MAP: { [key: string]: string } = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n'
};

// 检测文本中的对话内容
export function detectDialogues(text: string): IDialogue[] {
  const dialogues: IDialogue[] = [];
  
  for (const pattern of DIALOGUE_PATTERNS) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const dialogue: IDialogue = {
        original: match[1] || match[0],
        translated: '', // 待填充
        romaji: convertToRomaji(match[1] || match[0]),
        position: {
          start: match.index,
          end: match.index + match[0].length
        }
      };
      
      // 避免重复添加
      const exists = dialogues.some(d => 
        d.position.start === dialogue.position.start && 
        d.position.end === dialogue.position.end
      );
      
      if (!exists) {
        dialogues.push(dialogue);
      }
    }
  }
  
  return dialogues;
}

// 简单的罗马音转换
export function convertToRomaji(text: string): string {
  let romaji = '';
  
  for (const char of text) {
    if (ROMAJI_MAP[char]) {
      romaji += ROMAJI_MAP[char];
    } else {
      romaji += char;
    }
  }
  
  return romaji;
}

// 生成文本哈希用于缓存
function generateTextHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// 检查翻译缓存
async function getTranslationCache(text: string): Promise<ITranslation | null> {
  try {
    const hash = generateTextHash(text);
    const cache = await dbAdmin.getTranslationCache(hash);
    
    if (cache) {
      // 缓存命中，直接返回结果
      return {
        originalPrompt: cache.original_text,
        translatedPrompt: cache.translated_text,
        dialogues: cache.dialogue_info || [],
        translationTime: 0 // 缓存命中，时间为0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting translation cache:', error);
    return null;
  }
}

// 保存翻译缓存
async function saveTranslationCache(translation: ITranslation): Promise<void> {
  try {
    const hash = generateTextHash(translation.originalPrompt);
    
    await dbAdmin.createTranslationCache({
      originalText: translation.originalPrompt,
      translatedText: translation.translatedPrompt,
      dialogueInfo: translation.dialogues,
      hash
    });
  } catch (error) {
    console.error('Error saving translation cache:', error);
  }
}

// 使用OpenAI翻译文本
async function translateWithOpenAI(text: string): Promise<string> {
  try {
    const systemPrompt = `
You are a professional Japanese to English translator specializing in Veo3 video generation prompts.

Instructions:
1. Translate Japanese text to English naturally and accurately
2. For dialogue content (text in quotes), follow this format:
   - Add "Speak in Japanese" after the translated dialogue
   - Include romanized Japanese pronunciation in parentheses
   - Example: "Konnichiwa, kyou wa ii tenki desu ne (Hello, it's nice weather today)" - Speak in Japanese

3. Maintain the original structure and tone
4. Focus on creating prompts suitable for AI video generation
5. Be descriptive and visual in your translation

CRITICAL: Video Generation Guidelines:
- NEVER include instructions for text, subtitles, captions, or any written words to appear in the video
- AVOID phrases like "with subtitles", "showing text", "displaying words", "with captions", "text overlay"
- DO NOT mention romaji, hiragana, katakana, or any written characters appearing on screen
- Focus ONLY on visual elements, actions, scenes, environments, and spoken dialogue
- The video should be purely visual without any on-screen text or written elements

Guidelines for dialogue:
- Japanese: 「こんにちは、今日はいい天気ですね」
- English: "Konnichiwa, kyou wa ii tenki desu ne (Hello, it's nice weather today)" - Speak in Japanese

Please translate the following Japanese text:
`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const translatedText = response.choices[0]?.message?.content || '';
    
    if (!translatedText) {
      throw new Error('No translation received from OpenAI');
    }

    return translatedText;
  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw error;
  }
}

// 后处理翻译结果，确保对话格式正确
function postProcessTranslation(translation: string, dialogues: IDialogue[]): {
  processedTranslation: string;
  processedDialogues: IDialogue[];
} {
  let processedTranslation = translation;
  const processedDialogues: IDialogue[] = [];

  // 为每个对话内容添加翻译
  dialogues.forEach(dialogue => {
    // 尝试在翻译结果中找到对应的翻译
    const translatedDialogue = { ...dialogue };
    
    // 这里可以添加更复杂的匹配逻辑
    // 暂时使用简单的方式
    const quotedContent = `"${dialogue.original}"`;
    if (processedTranslation.includes(quotedContent)) {
      translatedDialogue.translated = dialogue.original; // 占位符
    }
    
    processedDialogues.push(translatedDialogue);
  });

  return {
    processedTranslation,
    processedDialogues
  };
}

// 主要翻译函数
export async function translatePrompt(
  originalPrompt: string,
  options: {
    useCache?: boolean;
    includeDialogue?: boolean;
    addRomaji?: boolean;
  } = {}
): Promise<IApiResponse<ITranslation>> {
  const startTime = Date.now();
  
  try {
    // 验证输入
    if (!originalPrompt || originalPrompt.trim().length === 0) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: 'Original prompt is required'
        }
      };
    }

    if (originalPrompt.length > 6000) {
      return {
        success: false,
        error: {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message: 'Prompt too long (max 6000 characters)'
        }
      };
    }

    // 检查缓存
    if (options.useCache !== false) {
      const cachedTranslation = await getTranslationCache(originalPrompt);
      if (cachedTranslation) {
        return {
          success: true,
          data: cachedTranslation
        };
      }
    }

    // 检测对话内容
    const dialogues = options.includeDialogue !== false 
      ? detectDialogues(originalPrompt) 
      : [];

    // 执行翻译
    const translatedText = await translateWithOpenAI(originalPrompt);

    // 后处理翻译结果
    const { processedTranslation, processedDialogues } = postProcessTranslation(
      translatedText, 
      dialogues
    );

    const translationTime = Date.now() - startTime;

    const result: ITranslation = {
      originalPrompt,
      translatedPrompt: processedTranslation,
      dialogues: processedDialogues,
      translationTime
    };

    // 保存到缓存
    if (options.useCache !== false) {
      await saveTranslationCache(result);
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Translation error:', error);
    
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.TRANSLATION_FAILED,
        message: error instanceof Error ? error.message : 'Translation failed'
      }
    };
  }
}

// 批量翻译
export async function translateBatch(
  prompts: string[],
  options: {
    useCache?: boolean;
    includeDialogue?: boolean;
    addRomaji?: boolean;
  } = {}
): Promise<IApiResponse<ITranslation[]>> {
  try {
    const translations: ITranslation[] = [];
    
    for (const prompt of prompts) {
      const result = await translatePrompt(prompt, options);
      
      if (result.success && result.data) {
        translations.push(result.data);
      } else {
        // 如果有一个失败，返回错误
        return {
          success: false,
          error: result.error || {
            code: API_ERROR_CODES.TRANSLATION_FAILED,
            message: 'Batch translation failed'
          }
        };
      }
    }

    return {
      success: true,
      data: translations
    };

  } catch (error) {
    console.error('Batch translation error:', error);
    
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.TRANSLATION_FAILED,
        message: 'Batch translation failed'
      }
    };
  }
}

// 验证翻译质量
export function validateTranslation(translation: ITranslation): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 检查基本字段
  if (!translation.originalPrompt || translation.originalPrompt.trim().length === 0) {
    issues.push('Original prompt is empty');
  }

  if (!translation.translatedPrompt || translation.translatedPrompt.trim().length === 0) {
    issues.push('Translated prompt is empty');
  }

  // 检查长度比例
  const originalLength = translation.originalPrompt.length;
  const translatedLength = translation.translatedPrompt.length;
  const ratio = translatedLength / originalLength;

  if (ratio < 0.5 || ratio > 3) {
    issues.push('Translation length ratio seems unusual');
  }

  // 检查对话内容
  if (translation.dialogues.length > 0) {
    translation.dialogues.forEach((dialogue, index) => {
      if (!dialogue.original || !dialogue.translated) {
        issues.push(`Dialogue ${index + 1} missing original or translated text`);
      }
      
      if (!dialogue.romaji) {
        issues.push(`Dialogue ${index + 1} missing romaji`);
      }
    });
  }

  // 检查是否包含"Speak in Japanese"标记
  const hasDialogue = translation.dialogues.length > 0;
  const hasJapaneseMarker = translation.translatedPrompt.includes('Speak in Japanese');
  
  if (hasDialogue && !hasJapaneseMarker) {
    issues.push('Missing "Speak in Japanese" marker for dialogue content');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// 清理翻译缓存
export async function cleanupTranslationCache(options: {
  olderThanDays?: number;
  maxUsageCount?: number;
} = {}): Promise<void> {
  try {
    // 这里需要实现缓存清理逻辑
    // 可以删除超过指定天数且使用次数少于阈值的缓存
    console.log('Cleaning up translation cache...', options);
    
    // TODO: 实现具体的清理逻辑
    
  } catch (error) {
    console.error('Error cleaning up translation cache:', error);
  }
}

// 获取翻译统计信息
export async function getTranslationStats(): Promise<{
  totalTranslations: number;
  cacheHitRate: number;
  averageTranslationTime: number;
  popularDialogues: IDialogue[];
}> {
  try {
    // 这里需要实现统计逻辑
    // 可以从数据库获取统计信息
    
    return {
      totalTranslations: 0,
      cacheHitRate: 0,
      averageTranslationTime: 0,
      popularDialogues: []
    };
  } catch (error) {
    console.error('Error getting translation stats:', error);
    return {
      totalTranslations: 0,
      cacheHitRate: 0,
      averageTranslationTime: 0,
      popularDialogues: []
    };
  }
}

// 预定义的常用翻译模板
export const COMMON_TRANSLATION_TEMPLATES = {
  GREETING: {
    japanese: 'こんにちは',
    english: 'Konnichiwa (Hello)',
    romaji: 'konnichiwa'
  },
  GOODBYE: {
    japanese: 'さようなら',
    english: 'Sayounara (Goodbye)',
    romaji: 'sayounara'
  },
  THANKS: {
    japanese: 'ありがとう',
    english: 'Arigatou (Thank you)',
    romaji: 'arigatou'
  },
  SORRY: {
    japanese: 'すみません',
    english: 'Sumimasen (Excuse me/Sorry)',
    romaji: 'sumimasen'
  }
};

// 常用提示词模板
export const VIDEO_PROMPT_TEMPLATES = {
  CONVERSATION: (dialogue: string) => 
    `A person having a conversation, saying "${dialogue}" - Speak in Japanese`,
  ANNOUNCEMENT: (message: string) => 
    `Someone making an announcement: "${message}" - Speak in Japanese`,
  GREETING_SCENE: (greeting: string) => 
    `A friendly greeting scene where someone says "${greeting}" - Speak in Japanese`,
  EMOTIONAL_SCENE: (emotion: string, dialogue: string) => 
    `A ${emotion} scene where someone says "${dialogue}" - Speak in Japanese`
}; 

// translateText函数 - API路由兼容包装器
export async function translateText(options: {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  includeRomaji?: boolean;
}): Promise<IApiResponse<{
  translatedText: string;
  dialogues: IDialogue[];
  confidence: number;
}>> {
  try {
    const { text, includeRomaji = true } = options;
    
    // 使用现有的translatePrompt函数
    const result = await translatePrompt(text, {
      useCache: false, // 暂时禁用缓存避免数据库依赖问题
      includeDialogue: true,
      addRomaji: includeRomaji
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || { 
          code: API_ERROR_CODES.SERVER_ERROR, 
          message: '翻译失败' 
        }
      };
    }

    return {
      success: true,
      data: {
        translatedText: result.data.translatedPrompt,
        dialogues: result.data.dialogues,
        confidence: 0.9 // 默认置信度
      }
    };
  } catch (error) {
    console.error('translateText error:', error);
    return {
      success: false,
      error: {
        code: API_ERROR_CODES.SERVER_ERROR,
        message: '翻译服务出错'
      }
    };
  }
} 