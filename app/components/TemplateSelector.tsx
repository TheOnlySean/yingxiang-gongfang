'use client';

import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import Image from 'next/image';

// 直接定义模板类型，避免导入服务器端代码
export type TemplateId = 'general' | 'selling' | 'selfie' | 'interview' | 'steadicam' | 'singing';

// 模板数据结构
export interface PromptTemplate {
  id: TemplateId;
  name: string;
  nameJa: string;
  description: string;
  thumbnail: string;
  example: string;
}

// 客户端模板定义 - 使用正确的日语名称
const CLIENT_TEMPLATES: Record<TemplateId, PromptTemplate> = {
  general: {
    id: 'general',
    name: 'GENERAL',
    nameJa: '一般',
    description: '一般的なシーン、特別な指定なし',
    thumbnail: '/templates/general.gif',
    example: '商品を紹介している女性、笑顔で魅力的に'
  },
  selling: {
    id: 'selling',
    name: 'SELLING',
    nameJa: '販売',
    description: '商品やサービスを販売・宣伝する動画',
    thumbnail: '/templates/selling.gif',
    example: '商品を紹介している女性、笑顔で魅力的に'
  },
  selfie: {
    id: 'selfie',
    name: 'SELFIE',
    nameJa: 'セルフィー',
    description: 'セルフィー風の近距離撮影',
    thumbnail: '/templates/selfie.gif',
    example: '女性がスマートフォンで自撮りをしている、自然な笑顔'
  },
  interview: {
    id: 'interview',
    name: 'INTERVIEW',
    nameJa: 'インタビュー',
    description: 'インタビューや対話シーン',
    thumbnail: '/templates/interview.gif',
    example: '男性がカメラに向かって話している、真剣な表情'
  },
  steadicam: {
    id: 'steadicam',
    name: 'STEADICAM',
    nameJa: 'ステディカム',
    description: 'ステディカムによる滑らかな移動撮影',
    thumbnail: '/templates/steadicam.gif',
    example: '女性が歩いている、カメラが滑らかに追従'
  },
  singing: {
    id: 'singing',
    name: 'SINGING',
    nameJa: '歌唱',
    description: '歌唱やパフォーマンスシーン',
    thumbnail: '/templates/singing.gif',
    example: '女性が歌っている、感情豊かな表現'
  }
};

interface TemplateSelectorProps {
  selectedTemplate: TemplateId | null;
  onTemplateSelect: (templateId: TemplateId | null) => void;
  onExampleSelect: (example: string) => void;
  isMobile?: boolean; // 新增移动端标识
}

export default function TemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  onExampleSelect,
  isMobile = false
}: TemplateSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentTemplate = selectedTemplate ? CLIENT_TEMPLATES[selectedTemplate] : CLIENT_TEMPLATES.general;

  const handleTemplateClick = (templateId: TemplateId) => {
    onTemplateSelect(templateId);
    setIsModalOpen(false);
  };

  const handleExampleClick = () => {
    if (currentTemplate) {
      onExampleSelect(currentTemplate.example);
    }
  };

  return (
    <>
      {/* 模板预览区域 - 放大图片尺寸 */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
          {/* 模板缩略图 - 根据设备类型调整尺寸 */}
          <div style={{
            width: isMobile ? '100px' : '160px',  // 移动端稍微增大
            height: isMobile ? '70px' : '100px', // 移动端增加高度
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#000',
            position: 'relative'
          }}>
            <Image
              src={currentTemplate.thumbnail}
              alt={currentTemplate.nameJa}
              fill
              style={{ objectFit: 'cover' }}
            />
            {/* 在图片上显示文字 - 修正为VEO3并分行 */}
            <div style={{
              position: 'absolute',
              bottom: '2px',
              left: '2px',
              right: '2px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff',
              padding: isMobile ? '2px 4px' : '3px 6px',
              borderRadius: '3px',
              fontSize: isMobile ? '8px' : '10px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)',
              lineHeight: '1.2'
            }}>
              優化されたGoogle VEO3<br />
              モデルを使用
            </div>
          </div>

          {/* 模板信息 */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              {/* 模板标签 - 改为日语 */}
              <div style={{
                background: 'linear-gradient(45deg, #ffd700, #ffed4a)',
                color: '#000',
                padding: isMobile ? '2px 4px' : '4px 8px',
                borderRadius: '4px',
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: 'bold'
              }}>
                {currentTemplate.nameJa}
              </div>

              {/* Change按钮 - 改为日语 */}
              <Button
                size={isMobile ? "small" : "small"}
                icon={<EditOutlined style={{ fontSize: isMobile ? '10px' : '12px' }} />}
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: isMobile ? '10px' : '12px',
                  padding: isMobile ? '2px 6px' : '4px 15px',
                  height: isMobile ? '24px' : 'auto'
                }}
              >
                変更
              </Button>
            </div>

            {/* 模板描述 */}
            <div style={{ 
              color: '#a0a0a0', 
              fontSize: isMobile ? '10px' : '12px',
              lineHeight: '1.4'
            }}>
              {currentTemplate.description}
            </div>
          </div>
        </div>
      </div>

      {/* 模板选择弹窗 */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={isMobile ? '95%' : 900}
        centered
        styles={{
          content: {
            background: 'rgba(26, 26, 26, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px'
          }
        }}
        closeIcon={
          <div style={{
            color: '#ffffff',
            fontSize: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            ×
          </div>
        }
      >
        <div style={{ color: '#ffffff' }}>
          <h3 style={{ 
            color: '#ffffff', 
            marginBottom: isMobile ? '16px' : '24px',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '600'
          }}>
            テンプレートを選択
          </h3>

          {/* 模板网格 - 根据设备类型调整布局 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 200px)', // 移动端2列，桌面端3列
            gap: isMobile ? '12px' : '20px',
            justifyContent: 'center' // 居中显示
          }}>
            {Object.values(CLIENT_TEMPLATES).map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template.id)}
                style={{
                  background: selectedTemplate === template.id 
                    ? 'rgba(255, 107, 107, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedTemplate === template.id 
                    ? '2px solid #ff6b6b' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedTemplate !== template.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedTemplate !== template.id) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              >
                {/* 模板图片 - 根据设备类型调整尺寸 */}
                <div style={{
                  width: '100%',
                  height: isMobile ? '180px' : '250px', // 移动端降低高度
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: '#000',
                  position: 'relative',
                  marginBottom: isMobile ? '8px' : '12px'
                }}>
                  <Image
                    src={template.thumbnail}
                    alt={template.nameJa}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                {/* 模板标签 - 使用日语名称 */}
                <div style={{
                  background: 'linear-gradient(45deg, #ffd700, #ffed4a)',
                  color: '#000',
                  padding: isMobile ? '2px 4px' : '4px 8px',
                  borderRadius: '4px',
                  fontSize: isMobile ? '10px' : '12px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginBottom: '4px'
                }}>
                  {template.nameJa}
                </div>

                {/* 模板描述 */}
                <div style={{
                  color: '#a0a0a0',
                  fontSize: isMobile ? '9px' : '11px',
                  textAlign: 'center',
                  lineHeight: '1.3'
                }}>
                  {template.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}
