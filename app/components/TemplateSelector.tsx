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
    thumbnail: '/templates/selling.jpg',
    example: '商品を紹介している女性、笑顔で魅力的に'
  },
  selfie: {
    id: 'selfie',
    name: 'SELFIE',
    nameJa: 'セルフィー',
    description: '自撮りスタイルの個人的な動画',
    thumbnail: '/templates/selfie.jpg',
    example: '自撮りをしている若い女性、自然な笑顔で'
  },
  interview: {
    id: 'interview',
    name: 'INTERVIEW',
    nameJa: 'インタビュー',
    description: 'インタビューや会話形式の動画',
    thumbnail: '/templates/interview.jpg',
    example: 'インタビューを受けている男性、真剣に話している'
  },
  steadicam: {
    id: 'steadicam',
    name: 'STEADICAM',
    nameJa: 'ステディカム',
    description: '滑らかなカメラワークの映画的な動画',
    thumbnail: '/templates/steadicam.jpg',
    example: 'カメラが滑らかに移動しながら人物を追っている'
  },
  singing: {
    id: 'singing',
    name: 'SINGING',
    nameJa: '歌唱',
    description: '歌唱やミュージカルパフォーマンスの動画',
    thumbnail: '/templates/singing.jpg',
    example: '歌を歌っている女性、感情豊かな表情で'
  },
  general: {
    id: 'general',
    name: 'GENERAL',
    nameJa: '一般',
    description: '一般的なシーン、特別な指定なし',
    thumbnail: '/templates/general.jpg',
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
      {/* 模板选择小框 - 放在prompt输入框上方 */}
      <div className="mb-4 p-4 bg-slate-800 rounded-lg border border-slate-600 shadow-lg">
        <div className="flex items-center justify-between">
          {/* 左侧：模板预览图片 */}
          <div className="flex items-center space-x-4">
            <div className="relative w-32 h-20 bg-slate-900 rounded-lg overflow-hidden border border-slate-500">
              <Image
                src={currentTemplate ? currentTemplate.thumbnail : '/templates/general.jpg'}
                alt={currentTemplate ? currentTemplate.nameJa : '一般'}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `data:image/svg+xml;base64,${btoa(`
                    <svg width="128" height="80" xmlns="http://www.w3.org/2000/svg">
                      <rect width="128" height="80" fill="#1e293b"/>
                      <text x="64" y="40" text-anchor="middle" dy="0.3em" fill="#f1f5f9" font-family="Arial" font-size="12" font-weight="bold">${currentTemplate?.name || 'GENERAL'}</text>
                    </svg>
                  `)}`;
                }}
              />
              {/* 播放图标覆盖层 */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <PlayCircleOutlined className="text-white text-2xl opacity-90" />
              </div>
            </div>
            
            {/* 模板信息 */}
            <div>
              <h3 className="text-white font-semibold text-lg">
                {currentTemplate ? currentTemplate.nameJa : '一般'}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {currentTemplate ? currentTemplate.description : '一般的なシーン、特別な指定なし'}
              </p>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center space-x-3">
            {currentTemplate && (
              <button
                onClick={handleExampleUse}
                className="px-3 py-2 text-sm text-amber-300 hover:text-amber-200 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-600 hover:border-amber-500 rounded-md transition-all duration-200"
              >
                例文を使用
              </button>
            )}
            <Button
              type="primary"
              icon={<SwapOutlined />}
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
            >
              変更
            </Button>
          </div>
        </div>
      </div>

      {/* 模板选择弹窗 */}
      <Modal
        title={null}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={1000}
        className="template-selector-modal"
        centered
        styles={{
          content: {
            padding: 0,
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        {/* 弹窗标题 */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 border-b border-slate-600">
          <h3 className="text-xl font-bold text-white text-center">
            Scene Template を選択
          </h3>
          <p className="text-sm text-slate-300 text-center mt-1">
            動画生成に最適なシーンテンプレートを選択してください
          </p>
        </div>

        {/* 模板网格 */}
        <div className="p-6 bg-slate-800">
          <div className="grid grid-cols-3 gap-6">
            {/* General选项 */}
            <div
              onClick={() => handleTemplateChange('general')}
              className={`cursor-pointer p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                selectedTemplate === 'general' || !selectedTemplate
                  ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-xl border-2 border-red-400'
                  : 'bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="w-full h-28 bg-slate-900 rounded-lg mb-4 overflow-hidden relative">
                <Image
                  src="/templates/general.jpg"
                  alt="一般"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;base64,${btoa(`
                      <svg width="200" height="112" xmlns="http://www.w3.org/2000/svg">
                        <rect width="200" height="112" fill="#1e293b"/>
                        <text x="100" y="56" text-anchor="middle" dy="0.3em" fill="#f1f5f9" font-family="Arial" font-size="16" font-weight="bold">GENERAL</text>
                      </svg>
                    `)}`;
                  }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <PlayCircleOutlined className="text-white text-3xl opacity-80" />
                </div>
              </div>
              <h4 className="font-bold text-lg text-white mb-2">一般</h4>
              <p className="text-sm text-slate-300 line-clamp-2">
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
                className={`cursor-pointer p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  selectedTemplate === template.id
                    ? 'bg-gradient-to-br from-red-600 to-red-700 shadow-xl border-2 border-red-400'
                    : 'bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="relative w-full h-28 bg-slate-900 rounded-lg mb-4 overflow-hidden">
                  <Image
                    src={template.thumbnail}
                    alt={template.nameJa}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `data:image/svg+xml;base64,${btoa(`
                        <svg width="200" height="112" xmlns="http://www.w3.org/2000/svg">
                          <rect width="200" height="112" fill="#1e293b"/>
                          <text x="100" y="56" text-anchor="middle" dy="0.3em" fill="#f1f5f9" font-family="Arial" font-size="14" font-weight="bold">${template.name}</text>
                        </svg>
                      `)}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <PlayCircleOutlined className="text-white text-3xl opacity-80" />
                  </div>
                </div>
                <h4 className="font-bold text-lg text-white mb-2">{template.nameJa}</h4>
                <p className="text-sm text-slate-300 line-clamp-2">
                  {template.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="bg-slate-900 px-6 py-4 border-t border-slate-600">
          <p className="text-xs text-slate-400 text-center">
            選択したテンプレートは動画生成時に自動的に適用されます
          </p>
        </div>
      </Modal>

      <style jsx global>{`
        .template-selector-modal .ant-modal-content {
          padding: 0 !important;
        }
        
        .template-selector-modal .ant-modal-close {
          color: #f1f5f9;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 50%;
          top: 12px;
          right: 12px;
        }
        
        .template-selector-modal .ant-modal-close:hover {
          color: #ffffff;
          background: rgba(0, 0, 0, 0.4);
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
