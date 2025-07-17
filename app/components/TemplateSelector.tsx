'use client';

import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { SwapOutlined, PlayCircleOutlined } from '@ant-design/icons';
import Image from 'next/image';

// 直接定义模板类型，避免导入服务器端代码
export type TemplateId = 'selling' | 'selfie' | 'interview' | 'steadicam' | 'singing' | 'general';

// 模板数据结构
export interface PromptTemplate {
  id: TemplateId;
  name: string;
  nameJa: string;
  description: string;
  thumbnail: string;
  example: string;
}

// 客户端模板定义（只包含UI需要的信息）
const CLIENT_TEMPLATES: Record<TemplateId, PromptTemplate> = {
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
    description: '自撮りスタイルの個人的な動画',
    thumbnail: '/templates/selfie.gif',
    example: '自撮りをしている若い女性、自然な笑顔で'
  },
  interview: {
    id: 'interview',
    name: 'INTERVIEW',
    nameJa: 'インタビュー',
    description: 'インタビューや会話形式の動画',
    thumbnail: '/templates/interview.gif',
    example: 'インタビューを受けている男性、真剣に話している'
  },
  steadicam: {
    id: 'steadicam',
    name: 'STEADICAM',
    nameJa: 'ステディカム',
    description: '滑らかなカメラワークの映画的な動画',
    thumbnail: '/templates/steadicam.gif',
    example: 'カメラが滑らかに移動しながら人物を追っている'
  },
  singing: {
    id: 'singing',
    name: 'SINGING',
    nameJa: '歌唱',
    description: '歌唱やミュージカルパフォーマンスの動画',
    thumbnail: '/templates/singing.gif',
    example: '歌を歌っている女性、感情豊かな表情で'
  },
  general: {
    id: 'general',
    name: 'GENERAL',
    nameJa: '一般',
    description: '一般的なシーン、特別な指定なし',
    thumbnail: '/templates/general.gif',
    example: '自然な表情の人物、日常的なシーンで'
  }
};

interface TemplateSelectorProps {
  selectedTemplate: TemplateId | null;
  onTemplateSelect: (templateId: TemplateId | null) => void;
  onExampleSelect: (example: string) => void;
}

export default function TemplateSelector({
  selectedTemplate,
  onTemplateSelect,
  onExampleSelect
}: TemplateSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentTemplate = selectedTemplate ? CLIENT_TEMPLATES[selectedTemplate] : null;

  const handleTemplateChange = (templateId: TemplateId) => {
    onTemplateSelect(templateId);
    setIsModalOpen(false);
  };

  const handleExampleUse = () => {
    if (currentTemplate) {
      onExampleSelect(currentTemplate.example);
    }
  };

  return (
    <>
      {/* 模板预览横幅 - 类似Higgsfield的设计 */}
      <div className="mb-4 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg border border-gray-700 relative overflow-hidden">
        {/* 背景模板图片 */}
        {currentTemplate && (
          <div className="absolute inset-0 opacity-20">
            <Image
              src={currentTemplate.thumbnail}
              alt={currentTemplate.nameJa}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* 前景内容 */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 模板预览图 */}
            <div className="relative w-20 h-12 bg-gray-700 rounded-md overflow-hidden flex-shrink-0 border border-gray-600">
              <Image
                src={currentTemplate ? currentTemplate.thumbnail : '/templates/general.gif'}
                alt={currentTemplate ? currentTemplate.nameJa : '一般'}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="80" height="48" xmlns="http://www.w3.org/2000/svg">
                      <rect width="80" height="48" fill="#4a5568"/>
                      <text x="40" y="24" text-anchor="middle" dy="0.3em" fill="#e2e8f0" font-family="Arial" font-size="8">${currentTemplate?.name || 'GENERAL'}</text>
                    </svg>
                  `)}`;
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircleOutlined className="text-white text-lg opacity-70" />
              </div>
            </div>

            {/* 模板信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg font-bold text-white">
                  {currentTemplate ? currentTemplate.name : 'GENERAL'}
                </span>
                <span className="text-sm text-gray-300">
                  {currentTemplate ? currentTemplate.nameJa : '一般'}
                </span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-1">
                {currentTemplate ? currentTemplate.description : '一般的なシーン、特別な指定なし'}
              </p>
            </div>
          </div>

          {/* 更换按钮 */}
          <div className="flex items-center space-x-2">
            {currentTemplate && (
              <button
                onClick={handleExampleUse}
                className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-red-400 hover:border-red-300 rounded transition-colors"
              >
                例文を使用
              </button>
            )}
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
              size="small"
            >
              変更
            </Button>
          </div>
        </div>
      </div>

      {/* 模板选择弹窗 */}
      <Modal
        title={
          <div className="text-center">
            <span className="text-lg font-semibold">Scene Template を選択</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={900}
        className="template-selector-modal"
        centered
      >
        <div className="grid grid-cols-3 gap-4 p-6">
          {/* General选项 */}
          <div
            onClick={() => handleTemplateChange('general')}
            className={`cursor-pointer p-4 border-2 rounded-lg transition-all hover:shadow-lg ${
              selectedTemplate === 'general' || !selectedTemplate
                ? 'border-red-500 bg-red-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-full h-24 bg-gray-200 rounded-md mb-3 flex items-center justify-center overflow-hidden">
              <Image
                src="/templates/general.gif"
                alt="一般"
                width={200}
                height={96}
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="200" height="96" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="96" fill="#8c8c8c"/>
                      <text x="100" y="48" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="16" font-weight="bold">GENERAL</text>
                    </svg>
                  `)}`;
                }}
              />
            </div>
            <h4 className="font-semibold text-base mb-1">一般</h4>
            <p className="text-sm text-gray-600 line-clamp-2">
              基本的なシーン、特別な指定なし
            </p>
          </div>

          {/* 其他模板选项 */}
          {Object.values(CLIENT_TEMPLATES)
            .filter(template => template.id !== 'general')
            .map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateChange(template.id)}
              className={`cursor-pointer p-4 border-2 rounded-lg transition-all hover:shadow-lg ${
                selectedTemplate === template.id
                  ? 'border-red-500 bg-red-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="relative w-full h-24 bg-gray-200 rounded-md mb-3 overflow-hidden">
                <Image
                  src={template.thumbnail}
                  alt={template.nameJa}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,${btoa(`
                      <svg width="200" height="96" xmlns="http://www.w3.org/2000/svg">
                        <rect width="200" height="96" fill="#6b7280"/>
                        <text x="100" y="48" text-anchor="middle" dy="0.3em" fill="white" font-family="Arial" font-size="14" font-weight="bold">${template.name}</text>
                      </svg>
                    `)}`;
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircleOutlined className="text-white text-2xl opacity-80" />
                </div>
              </div>
              <h4 className="font-semibold text-base mb-1">{template.nameJa}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {template.description}
              </p>
            </div>
          ))}
        </div>
      </Modal>

      <style jsx global>{`
        .template-selector-modal .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .template-selector-modal .ant-modal-header {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 1px solid #e2e8f0;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
