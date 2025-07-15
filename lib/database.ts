import { Client } from 'pg';
import { IUser, IVideo } from '@/types';

// 创建数据库连接
export async function createDbConnection(): Promise<Client> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  await client.connect();
  return client;
}

// 数据库用户转换为应用用户格式
export function dbUserToUser(dbUser: any): IUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    credits: dbUser.credits || 0,
    totalUsed: dbUser.total_used || 0,
    videosGenerated: dbUser.videos_generated || 0,
    isActive: dbUser.is_active || false,
    emailVerified: dbUser.email_verified || false,
    plan: dbUser.plan || 'free',
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    googleId: dbUser.google_id,
    lineId: dbUser.line_id,
    avatarUrl: dbUser.avatar_url || '',
    authProvider: dbUser.auth_provider || 'email',
    displayName: dbUser.display_name || '',
    emailVerificationToken: dbUser.email_verification_token,
    emailVerificationExpiresAt: dbUser.email_verification_expires_at,
    passwordResetToken: dbUser.password_reset_token,
    passwordResetExpiresAt: dbUser.password_reset_expires_at
  };
}

export function dbVideoToVideo(dbVideo: any): IVideo {
  return {
    id: dbVideo.id,
    userId: dbVideo.user_id,
    originalPrompt: dbVideo.original_prompt,
    translatedPrompt: dbVideo.translated_prompt,
    taskId: dbVideo.task_id,
    status: dbVideo.status,
    videoUrl: dbVideo.video_url,
    thumbnailUrl: dbVideo.thumbnail_url,
    imageUrls: dbVideo.image_urls ? (typeof dbVideo.image_urls === 'string' ? JSON.parse(dbVideo.image_urls) : dbVideo.image_urls) : undefined,
    creditsUsed: dbVideo.credits_used,
    errorMessage: dbVideo.error_message,
    kieAiExpiresAt: dbVideo.kie_ai_expires_at,
    localExpiresAt: dbVideo.local_expires_at,
    storageStatus: dbVideo.storage_status,
    createdAt: dbVideo.created_at,
    updatedAt: dbVideo.updated_at,
    completedAt: dbVideo.completed_at,
  };
}

// 用户操作函数
export const userOperations = {
  // 根据邮箱查找用户
  async findByEmail(email: string): Promise<IUser | null> {
    const client = await createDbConnection();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      if (result.rows.length === 0) return null;
      return dbUserToUser(result.rows[0]);
    } finally {
      await client.end();
    }
  },

  // 根据ID查找用户
  async findById(id: string): Promise<IUser | null> {
    const client = await createDbConnection();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) return null;
      return dbUserToUser(result.rows[0]);
    } finally {
      await client.end();
    }
  },

  // 创建新用户
  async create(userData: {
    email: string;
    password: string;
    displayName?: string;
    googleId?: string;
    lineId?: string;
    authProvider?: 'email' | 'google' | 'line';
  }): Promise<IUser> {
    const client = await createDbConnection();
    try {
      const result = await client.query(`
        INSERT INTO users (
          email, password_hash, display_name, credits, total_used, videos_generated,
          is_active, email_verified, google_id, line_id, auth_provider,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `, [
        userData.email,
        userData.password, // 这里应该传入已经哈希化的密码
        userData.displayName || '',
        1000, // 初始积分
        0, // 总使用积分
        0, // 生成视频数
        true, // 直接激活
        true, // 直接验证邮箱
        userData.googleId || null,
        userData.lineId || null,
        userData.authProvider || 'email'
      ]);
      
      return dbUserToUser(result.rows[0]);
    } finally {
      await client.end();
    }
  },

  // 更新用户信息
  async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    const client = await createDbConnection();
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (userData.displayName !== undefined) {
        updateFields.push(`display_name = $${paramIndex++}`);
        values.push(userData.displayName);
      }
      if (userData.credits !== undefined) {
        updateFields.push(`credits = $${paramIndex++}`);
        values.push(userData.credits);
      }
      if (userData.totalUsed !== undefined) {
        updateFields.push(`total_used = $${paramIndex++}`);
        values.push(userData.totalUsed);
      }
      if (userData.videosGenerated !== undefined) {
        updateFields.push(`videos_generated = $${paramIndex++}`);
        values.push(userData.videosGenerated);
      }
      if (userData.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(userData.isActive);
      }
      if (userData.emailVerified !== undefined) {
        updateFields.push(`email_verified = $${paramIndex++}`);
        values.push(userData.emailVerified);
      }
      if (userData.avatarUrl !== undefined) {
        updateFields.push(`avatar_url = $${paramIndex++}`);
        values.push(userData.avatarUrl);
      }
      if (userData.passwordResetToken !== undefined) {
        updateFields.push(`password_reset_token = $${paramIndex++}`);
        values.push(userData.passwordResetToken);
      }
      if (userData.passwordResetExpiresAt !== undefined) {
        updateFields.push(`password_reset_expires_at = $${paramIndex++}`);
        values.push(userData.passwordResetExpiresAt);
      }

      if (updateFields.length === 0) {
        return await this.findById(id);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await client.query(`
        UPDATE users SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) return null;
      return dbUserToUser(result.rows[0]);
    } finally {
      await client.end();
    }
  },

  // 更新用户积分
  async updateCredits(id: string, credits: number): Promise<boolean> {
    const client = await createDbConnection();
    try {
      const result = await client.query(
        'UPDATE users SET credits = $1, updated_at = NOW() WHERE id = $2',
        [credits, id]
      );
      return (result.rowCount ?? 0) > 0;
    } finally {
      await client.end();
    }
  },

  // 扣除积分
  async deductCredits(id: string, amount: number): Promise<boolean> {
    const client = await createDbConnection();
    try {
      const result = await client.query(
        'UPDATE users SET credits = credits - $1, total_used = total_used + $1, updated_at = NOW() WHERE id = $2 AND credits >= $1',
        [amount, id]
      );
      return (result.rowCount ?? 0) > 0;
    } finally {
      await client.end();
    }
  },

  // 增加积分
  async addCredits(id: string, amount: number): Promise<boolean> {
    const client = await createDbConnection();
    try {
      const result = await client.query(
        'UPDATE users SET credits = credits + $1, updated_at = NOW() WHERE id = $2',
        [amount, id]
      );
      return (result.rowCount ?? 0) > 0;
    } finally {
      await client.end();
    }
  },

  // 连接方法（保持兼容性）
  async connect() {
    return await createDbConnection();
  },

  // Google OAuth相关方法
  // 根据Google ID查找用户
  async getUserByGoogleId(googleId: string): Promise<IUser | null> {
    const client = await createDbConnection();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
      );
      if (result.rows.length === 0) return null;
      return dbUserToUser(result.rows[0]);
    } finally {
      await client.end();
    }
  },

  async findByLineId(lineId: string): Promise<IUser | null> {
    const client = await createDbConnection();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE line_id = $1',
        [lineId]
      );
      if (result.rows.length === 0) return null;
      return dbUserToUser(result.rows[0]);
    } finally {
      await client.end();
    }
  },

  // 根据邮箱查找用户（别名方法以兼容OAuth API）
  async getUserByEmail(email: string): Promise<IUser | null> {
    return await this.findByEmail(email);
  },

  // 用于登录验证的方法，返回包含密码哈希的原始数据
  async findByEmailForAuth(email: string): Promise<any | null> {
    const client = await createDbConnection();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      if (result.rows.length === 0) return null;
      return result.rows[0]; // 返回原始数据库记录
    } finally {
      await client.end();
    }
  },

  // 将OAuth账户链接到现有用户
  async linkOAuthAccount(userId: string, oauthData: {
    google_id?: string;
    line_id?: string;
    avatar_url?: string;
    display_name?: string;
  }): Promise<IUser | null> {
    const client = await createDbConnection();
    try {
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (oauthData.google_id !== undefined) {
        updateFields.push(`google_id = $${paramIndex++}`);
        values.push(oauthData.google_id);
      }
      if (oauthData.line_id !== undefined) {
        updateFields.push(`line_id = $${paramIndex++}`);
        values.push(oauthData.line_id);
      }
      if (oauthData.avatar_url !== undefined) {
        updateFields.push(`avatar_url = $${paramIndex++}`);
        values.push(oauthData.avatar_url);
      }
      if (oauthData.display_name !== undefined) {
        updateFields.push(`display_name = $${paramIndex++}`);
        values.push(oauthData.display_name);
      }

      if (updateFields.length === 0) {
        return await this.findById(userId);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(userId);

      const result = await client.query(`
        UPDATE users SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) return null;
      return dbUserToUser(result.rows[0]);
    } finally {
      await client.end();
    }
  },

  // 创建OAuth用户
  async createOAuthUser(userData: {
    email?: string;
    google_id?: string;
    line_id?: string;
    display_name?: string;
    avatar_url?: string;
    auth_provider: 'google' | 'line';
    credits?: number;
  }): Promise<IUser> {
    const client = await createDbConnection();
    try {
      const result = await client.query(`
        INSERT INTO users (
          email, password_hash, display_name, credits, total_used, videos_generated,
          is_active, email_verified, google_id, line_id, auth_provider, avatar_url,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `, [
        userData.email || '',
        '', // OAuth用户无密码哈希
        userData.display_name || '',
        userData.credits || 1000, // 初始积分
        0, // 总使用积分
        0, // 生成视频数
        true, // 直接激活
        true, // 直接验证
        userData.google_id || null,
        userData.line_id || null,
        userData.auth_provider,
        userData.avatar_url || ''
      ]);
      
      return dbUserToUser(result.rows[0]);
    } finally {
      await client.end();
    }
  },

  // 视频相关方法
  async createVideo(videoData: any): Promise<any> {
    const client = await createDbConnection();
    try {
      const result = await client.query(`
        INSERT INTO videos (
          user_id, original_prompt, translated_prompt, task_id, status,
          credits_used, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [
        videoData.userId,
        videoData.originalPrompt,
        videoData.translatedPrompt,
        videoData.taskId,
        videoData.status || 'pending',
        videoData.creditsUsed || 300
      ]);
      return result.rows[0];
    } finally {
      await client.end();
    }
  },

  async getVideoByTaskId(taskId: string): Promise<any | null> {
    const client = await createDbConnection();
    try {
      const result = await client.query('SELECT * FROM videos WHERE task_id = $1', [taskId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  },

  async getPendingVideos(limit: number = 5): Promise<any[]> {
    const client = await createDbConnection();
    try {
      const result = await client.query(`
        SELECT * FROM videos 
        WHERE status IN ('pending', 'processing') 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);
      return result.rows;
    } finally {
      await client.end();
    }
  },

  async getUserVideos(userId: string, options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}): Promise<any[]> {
    const client = await createDbConnection();
    try {
      const { limit = 10, offset = 0, status } = options;
      
      let query = 'SELECT * FROM videos WHERE user_id = $1';
      const params: any[] = [userId];
      
      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      await client.end();
    }
  },

  async updateVideo(id: string, updates: any): Promise<any | null> {
    const client = await createDbConnection();
    try {
      const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = [id, ...Object.values(updates)];
      
      const result = await client.query(`
        UPDATE videos SET ${setClause}, updated_at = NOW()
        WHERE id = $1 RETURNING *
      `, values);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  },

  // 翻译缓存相关方法
  async getTranslationCache(hash: string): Promise<any | null> {
    const client = await createDbConnection();
    try {
      const result = await client.query('SELECT * FROM translation_cache WHERE hash = $1', [hash]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  },

  async createTranslationCache(cacheData: any): Promise<any> {
    const client = await createDbConnection();
    try {
      const result = await client.query(`
        INSERT INTO translation_cache (
          original_text, translated_text, dialogue_info, hash, usage_count,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [
        cacheData.originalText,
        cacheData.translatedText,
        JSON.stringify(cacheData.dialogueInfo || []),
        cacheData.hash,
        1
      ]);
      return result.rows[0];
    } finally {
      await client.end();
    }
  }
};

// 导出数据库操作（保持兼容性）
export { userOperations as dbAdmin };
export { userOperations as db };
