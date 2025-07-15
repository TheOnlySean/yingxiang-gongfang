'use client';

import { Card, Typography, Steps, Alert, Divider } from 'antd';

const { Title, Text, Paragraph } = Typography;

export default function OAuthGuidePage() {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <Title level={2}>Google Cloud Console OAuth 配置指南</Title>
      
      <Alert
        message="解决 'invalid_request' 错误"
        description="此错误通常是因为应用处于测试状态或域名配置不正确导致的。"
        type="warning"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      <Steps
        direction="vertical"
        items={[
          {
            title: '步骤1：进入OAuth同意屏幕',
            description: (
              <div>
                <ol>
                  <li>打开 <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                  <li>确保选择的是 "angelsphoto" 项目</li>
                  <li>在左侧菜单中，点击 <strong>"APIs & Services"</strong></li>
                  <li>然后点击 <strong>"OAuth consent screen"</strong></li>
                </ol>
              </div>
            ),
          },
          {
            title: '步骤2：配置授权域名',
            description: (
              <div>
                <Paragraph>在OAuth同意屏幕页面中：</Paragraph>
                <ol>
                  <li>向下滚动找到 <strong>"Authorized domains"</strong> 字段</li>
                  <li>在输入框中添加：<Text code>eizokobo.vercel.app</Text></li>
                  <li>点击 <strong>"ADD DOMAIN"</strong> 或 <strong>"+"</strong> 按钮</li>
                  <li>点击页面底部的 <strong>"SAVE AND CONTINUE"</strong></li>
                </ol>
              </div>
            ),
          },
          {
            title: '步骤3：发布应用（最重要！）',
            description: (
              <div>
                <Alert
                  message="这是解决错误的关键步骤"
                  type="error"
                  showIcon
                  style={{ marginBottom: '10px' }}
                />
                <ol>
                  <li>在OAuth同意屏幕页面顶部查看应用状态</li>
                  <li>如果状态是 <strong>"Testing"</strong>：</li>
                  <ul>
                    <li>找到 <strong>"PUBLISH APP"</strong> 按钮（通常在页面右上角）</li>
                    <li>点击 <strong>"PUBLISH APP"</strong></li>
                    <li>在确认对话框中点击 <strong>"CONFIRM"</strong></li>
                  </ul>
                  <li>如果找不到"PUBLISH APP"按钮，查看是否有：</li>
                  <ul>
                    <li><strong>"MAKE EXTERNAL"</strong> 按钮</li>
                    <li><strong>"SUBMIT FOR VERIFICATION"</strong> 按钮</li>
                  </ul>
                </ol>
              </div>
            ),
          },
          {
            title: '步骤4：更新OAuth客户端配置',
            description: (
              <div>
                <Paragraph>在 <strong>"APIs & Services"</strong> → <strong>"Credentials"</strong> 中：</Paragraph>
                <ol>
                  <li>点击您的OAuth 2.0客户端ID</li>
                  <li>在 <strong>"Authorized redirect URIs"</strong> 中添加：</li>
                  <ul>
                    <li><Text code>http://localhost:3003/auth/google/callback</Text></li>
                    <li><Text code>https://eizokobo.vercel.app/auth/google/callback</Text></li>
                  </ul>
                  <li>在 <strong>"Authorized JavaScript origins"</strong> 中添加：</li>
                  <ul>
                    <li><Text code>http://localhost:3003</Text></li>
                    <li><Text code>https://eizokobo.vercel.app</Text></li>
                  </ul>
                  <li>点击 <strong>"SAVE"</strong></li>
                </ol>
              </div>
            ),
          },
          {
            title: '步骤5：验证配置',
            description: (
              <div>
                <ol>
                  <li>访问 <a href="https://eizokobo.vercel.app/debug-oauth" target="_blank">调试页面</a></li>
                  <li>点击"生成OAuth URL"按钮</li>
                  <li>尝试OAuth登录流程</li>
                  <li>如果仍有问题，清除浏览器缓存后重试</li>
                </ol>
              </div>
            ),
          },
        ]}
      />

      <Divider />

      <Card title="常见问题解答" style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <Text strong>Q: 找不到 "PUBLISH APP" 按钮怎么办？</Text>
          <br />
          <Text>A: 检查页面顶部是否有其他发布相关的按钮，如"MAKE EXTERNAL"或"SUBMIT FOR VERIFICATION"。</Text>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <Text strong>Q: 应用状态显示什么是正常的？</Text>
          <br />
          <Text>A: 应该显示 "In production" 或 "Published" 状态。</Text>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <Text strong>Q: 如果应用必须保持测试状态怎么办？</Text>
          <br />
          <Text>A: 在OAuth同意屏幕中添加您的邮箱地址到"Test users"列表中。</Text>
        </div>
      </Card>

      <Alert
        message="重要提醒"
        description="完成所有配置后，请等待5-10分钟让Google的配置生效，然后再测试OAuth登录。"
        type="info"
        showIcon
        style={{ marginTop: '20px' }}
      />
    </div>
  );
} 