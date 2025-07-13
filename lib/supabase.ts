import { Pool } from 'pg';
import { IUser, IVideo } from '@/types';

// Neon PostgreSQL 连接池 (亚洲区域 - 新加坡)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 数据库管理类
class DatabaseAdmin {
  
  // 用户管理
  async createUser(userData: {
          email: string;
          password_hash: string;
          credits?: number;
  }) {
    const query = `
      INSERT INTO users (email, password_hash, credits)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userData.email,
      userData.password_hash,
      userData.credits || 1000
    ]);
    
    return result.rows[0];
  }

  async getUserById(userId: string) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async updateUser(userId: string, updates: any) {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;
    
    const values = [userId, ...Object.values(updates)];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // 视频管理
  async createVideo(videoData: {
    user_id: string;
    original_prompt: string;
    translated_prompt: string;
    task_id: string;
    status?: string;
    image_urls?: string;
    credits_used: number;
  }) {
    const query = `
      INSERT INTO videos (user_id, original_prompt, translated_prompt, task_id, status, image_urls, credits_used)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      videoData.user_id,
      videoData.original_prompt,
      videoData.translated_prompt,
      videoData.task_id,
      videoData.status || 'pending',
      videoData.image_urls || null,
      videoData.credits_used
    ]);
    
    return result.rows[0];
  }

  async getVideoById(videoId: string) {
    const query = 'SELECT * FROM videos WHERE id = $1';
    const result = await pool.query(query, [videoId]);
    return result.rows[0] || null;
  }

  async getVideoByTaskId(taskId: string) {
    const query = 'SELECT * FROM videos WHERE task_id = $1';
    const result = await pool.query(query, [taskId]);
    return result.rows[0] || null;
  }

  async updateVideo(videoId: string, updates: any) {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE videos 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;
    
    const values = [videoId, ...Object.values(updates)];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async getUserVideos(userId: string, options: {
    limit?: number;
    offset?: number;
    status?: string;
  } = {}) {
    let query = 'SELECT * FROM videos WHERE user_id = $1';
    const values: any[] = [userId];
    let paramCount = 1;

    if (options.status) {
      query += ` AND status = $${++paramCount}`;
      values.push(options.status);
    }

    query += ' ORDER BY created_at DESC';

    if (options.limit) {
      query += ` LIMIT $${++paramCount}`;
      values.push(options.limit);
    }

    if (options.offset) {
      query += ` OFFSET $${++paramCount}`;
      values.push(options.offset);
    }

    const result = await pool.query(query, values);
    
    // 获取总数
    const countQuery = options.status 
      ? 'SELECT COUNT(*) FROM videos WHERE user_id = $1 AND status = $2'
      : 'SELECT COUNT(*) FROM videos WHERE user_id = $1';
    
    const countValues = options.status ? [userId, options.status] : [userId];
    const countResult = await pool.query(countQuery, countValues);
    
    return {
      videos: result.rows,
      total: parseInt(countResult.rows[0].count)
    };
  }

  async deleteVideo(videoId: string) {
    const query = 'DELETE FROM videos WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [videoId]);
    return result.rows[0] || null;
  }

  // 会话管理
  async createSession(sessionData: {
    user_id: string;
    token_hash: string;
    expires_at: string;
    ip_address?: string;
    user_agent?: string;
  }) {
    const query = `
      INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      sessionData.user_id,
      sessionData.token_hash,
      sessionData.expires_at,
      sessionData.ip_address || null,
      sessionData.user_agent || null
    ]);
    
    return result.rows[0];
  }

  async getSessionByTokenHash(tokenHash: string) {
    const query = 'SELECT * FROM user_sessions WHERE token_hash = $1 AND is_active = true';
    const result = await pool.query(query, [tokenHash]);
    return result.rows[0] || null;
  }

  async updateSession(sessionId: string, updates: any) {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const query = `
      UPDATE user_sessions 
      SET ${setClause}
      WHERE id = $1 
      RETURNING *
    `;
    
    const values = [sessionId, ...Object.values(updates)];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async deactivateSession(tokenHash: string) {
    const query = `
      UPDATE user_sessions 
      SET is_active = false 
      WHERE token_hash = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [tokenHash]);
    return result.rows[0] || null;
  }

  async deleteSession(sessionId: string) {
    const query = 'DELETE FROM user_sessions WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  }

  async cleanupExpiredSessions() {
    const query = 'DELETE FROM user_sessions WHERE expires_at < NOW()';
    const result = await pool.query(query);
    return result.rowCount || 0;
  }

  // 翻译缓存管理
  async getTranslationCache(hash: string) {
    const query = 'SELECT * FROM translation_cache WHERE hash = $1';
    const result = await pool.query(query, [hash]);
    return result.rows[0] || null;
  }

  async createTranslationCache(cacheData: {
    original_text: string;
    translated_text: string;
    dialogue_info?: object;
    hash: string;
  }) {
    const query = `
      INSERT INTO translation_cache (original_text, translated_text, dialogue_info, hash)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      cacheData.original_text,
      cacheData.translated_text,
      JSON.stringify(cacheData.dialogue_info) || null,
      cacheData.hash
    ]);
    
    return result.rows[0];
  }

  async updateTranslationCacheUsage(hash: string) {
    const query = `
      UPDATE translation_cache 
      SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE hash = $1 
      RETURNING *
    `;
    
    const result = await pool.query(query, [hash]);
    return result.rows[0] || null;
  }

  // 工具方法
  async testConnection() {
    try {
      const result = await pool.query('SELECT NOW()');
      return { success: true, timestamp: result.rows[0].now };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async close() {
    await pool.end();
  }
}

// 导出数据库管理实例
export const dbAdmin = new DatabaseAdmin();

// 兼容性导出
export { dbAdmin as supabase, dbAdmin as createClient };

// 类型转换辅助函数
export function dbUserToUser(dbUser: any): IUser {
  return {
    id: dbUser.id,
    email: dbUser.email,
    credits: dbUser.credits,
    totalUsed: dbUser.total_used,
    videosGenerated: dbUser.videos_generated,
    isActive: dbUser.is_active,
    plan: dbUser.plan || 'free',
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at
  };
}

export function dbVideoToVideo(dbVideo: any): IVideo {
  const video: IVideo = {
    id: dbVideo.id,
    userId: dbVideo.user_id,
    originalPrompt: dbVideo.original_prompt,
    translatedPrompt: dbVideo.translated_prompt,
    taskId: dbVideo.task_id,
    status: dbVideo.status,
    videoUrl: dbVideo.video_url || undefined,
    thumbnailUrl: dbVideo.thumbnail_url || undefined,
    imageUrls: dbVideo.image_urls ? (typeof dbVideo.image_urls === 'string' ? JSON.parse(dbVideo.image_urls) : dbVideo.image_urls) : undefined,
    creditsUsed: dbVideo.credits_used,
    errorMessage: dbVideo.error_message || undefined,
    createdAt: dbVideo.created_at,
    updatedAt: dbVideo.updated_at,
    completedAt: dbVideo.completed_at || undefined
  };

  return video;
}

export function dbPaymentToPayment(dbPayment: any): any {
  const payment: any = {
    id: dbPayment.id,
    userId: dbPayment.user_id,
    orderId: dbPayment.order_id,
    transactionId: dbPayment.transaction_id,
    paymentMethod: dbPayment.payment_method,
    packageId: dbPayment.package_id,
    amount: dbPayment.amount,
    currency: dbPayment.currency,
    creditsPurchased: dbPayment.credits_purchased,
    status: dbPayment.status,
    metadata: dbPayment.metadata,
    createdAt: dbPayment.created_at,
    updatedAt: dbPayment.updated_at,
    completedAt: dbPayment.completed_at
  };

  return payment;
} 