#!/usr/bin/env node

// 映像工房 - API连接测试脚本
// 用于测试OpenAI和KIE.AI API是否正常连接

require('dotenv').config();

const https = require('https');
const { Pool } = require('pg');

// 颜色输出函数
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试数据库连接
async function testDatabase() {
  log('blue', '\n📁 测试数据库连接...');
  
  if (!process.env.DATABASE_URL) {
    log('red', '❌ DATABASE_URL 环境变量未设置');
    return false;
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query('SELECT NOW(), version()');
    log('green', `✅ 数据库连接成功`);
    log('blue', `   时间: ${result.rows[0].now}`);
    log('blue', `   区域: 亚洲太平洋 (新加坡)`);
    
    // 检查表是否存在
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    
    log('blue', `   表数量: ${tables.rows.length}`);
    tables.rows.forEach(row => {
      log('blue', `   - ${row.table_name}`);
    });

    await pool.end();
    return true;
  } catch (error) {
    log('red', `❌ 数据库连接失败: ${error.message}`);
    return false;
  }
}

// 测试OpenAI API
async function testOpenAI() {
  log('blue', '\n🤖 测试OpenAI API连接...');
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
    log('yellow', '⚠️  OPENAI_API_KEY 未设置或为占位符');
    log('yellow', '   请在.env文件中填入真实的OpenAI API密钥');
    return false;
  }

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: 'Hello, please respond with exactly: "OpenAI API test successful"'
        }
      ],
      max_tokens: 20
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.choices && response.choices[0]) {
            log('green', '✅ OpenAI API连接成功');
            log('blue', `   模型: ${response.model}`);
            log('blue', `   响应: ${response.choices[0].message.content}`);
            resolve(true);
          } else {
            log('red', `❌ OpenAI API错误: ${response.error?.message || 'Unknown error'}`);
            resolve(false);
          }
        } catch (error) {
          log('red', `❌ OpenAI API响应解析错误: ${error.message}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log('red', `❌ OpenAI API请求错误: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(10000, () => {
      log('red', '❌ OpenAI API请求超时');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// 测试KIE.AI API
async function testKieAI() {
  log('blue', '\n🎬 测试KIE.AI API连接...');
  
  if (!process.env.KIE_AI_API_KEY || process.env.KIE_AI_API_KEY === 'your-kie-ai-api-key-here') {
    log('yellow', '⚠️  KIE_AI_API_KEY 未设置或为占位符');
    log('yellow', '   请在.env文件中填入真实的KIE.AI API密钥');
    return false;
  }

  return new Promise((resolve) => {
    // 构建API URL
    const url = new URL('/api/v1/veo/generate', process.env.KIE_AI_BASE_URL || 'https://api.kie.ai');
    
    const postData = JSON.stringify({
      prompt: 'A simple test video prompt',
      model: 'veo3_fast'  // 正確模型名稱
    });

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          // 修复: KIE.AI的响应格式是嵌套的 {code: 200, data: {taskId: "..."}}
          if (res.statusCode === 200 && response.data && response.data.taskId) {
            log('green', '✅ KIE.AI API连接成功');
            log('blue', `   任务ID: ${response.data.taskId}`);
            log('blue', `   基础URL: ${process.env.KIE_AI_BASE_URL}`);
            resolve(true);
          } else if (res.statusCode === 401) {
            log('red', '❌ KIE.AI API认证失败 - 请检查API密钥');
            resolve(false);
          } else {
            log('red', `❌ KIE.AI API错误 (${res.statusCode}): ${response.message || response.msg || 'Unknown error'}`);
            log('yellow', `   完整响应: ${JSON.stringify(response, null, 2)}`);
            resolve(false);
          }
        } catch (error) {
          log('red', `❌ KIE.AI API响应解析错误: ${error.message}`);
          log('yellow', `   状态码: ${res.statusCode}`);
          log('yellow', `   原始响应: ${data.substring(0, 200)}...`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log('red', `❌ KIE.AI API请求错误: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(15000, () => {
      log('red', '❌ KIE.AI API请求超时');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// 主测试函数
async function runTests() {
  log('blue', '🚀 开始API连接测试...\n');
  
  const results = {
    database: await testDatabase(),
    openai: await testOpenAI(),
    kieai: await testKieAI()
  };

  // 总结报告
  log('blue', '\n📊 测试结果总结:');
  log('blue', '================================');
  
  if (results.database) {
    log('green', '✅ 数据库: 连接成功 (亚洲区域)');
  } else {
    log('red', '❌ 数据库: 连接失败');
  }
  
  if (results.openai) {
    log('green', '✅ OpenAI API: 连接成功');
  } else {
    log('red', '❌ OpenAI API: 连接失败');
  }
  
  if (results.kieai) {
    log('green', '✅ KIE.AI API: 连接成功');
  } else {
    log('red', '❌ KIE.AI API: 连接失败');
  }

  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  log('blue', '\n🎯 完成情况:');
  log(successCount === totalCount ? 'green' : 'yellow', 
    `   ${successCount}/${totalCount} 项测试通过`);
  
  if (successCount === totalCount) {
    log('green', '\n🎉 所有API连接正常！可以开始测试页面端了。');
    log('green', '🚀 建议运行以下命令启动开发服务器:');
    log('blue', '   npm run dev');
  } else {
    log('yellow', '\n⚠️  请先填入缺失的API密钥，然后重新运行测试:');
    log('yellow', '   node test-apis.js');
  }
}

// 运行测试
runTests().catch(error => {
  log('red', `❌ 测试脚本错误: ${error.message}`);
  process.exit(1);
}); 